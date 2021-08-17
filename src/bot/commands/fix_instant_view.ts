import Verror                   from 'verror'
import nhentai, {Doujin}        from '../../lib/nhentai'
import {
  uploadByUrl,
  uploadResult
}                               from 'telegraph-uploader'
import { telegraphCreatePage }  from '../../lib/telegraph'
import i18n                     from '../../lib/i18n'
import config                   from '../../../config'
import { getMangaMessage }      from '../../lib/some_functions'
import saveAndGetUser           from '../../db/save_and_get_user'
import saveAndGetManga          from '../../db/save_and_get_manga'
import Message                  from '../../models/message.model'
import { UserSchema }           from '../../models/user.model'
import { MangaSchema }          from '../../models/manga.model'
import { Document }             from 'mongoose'
import { Context }              from 'telegraf'
import { InlineKeyboardButton } from 'typegram'
import { CallbackQuery }        from 'telegraf/typings/core/types/typegram'

export default async function fixInstantView(ctx: Context, callback_query: CallbackQuery.DataCallbackQuery): Promise<void> {

  const matchId = callback_query.data.match(/_[0-9]+/)
  if(!matchId || !Number(matchId[0])) {
    return
  }
  const doujinId = Number(matchId[0])

  let user: UserSchema & Document<any, any, UserSchema> | undefined
  try {
    user = await saveAndGetUser(ctx)
  } catch (error) {
    throw new Verror(error, 'Getting user in callbackHandler')
  }

  let doujin: MangaSchema & Document<any, any, MangaSchema>
  try {
    doujin = await saveAndGetManga(user, doujinId)
  } catch (error) {
    if(error.message === 'Not found') {
      try {
        await ctx.reply(i18n.__('manga_does_not_exist') + '\n(' + doujinId + ')')
      } catch (error) {
        console.error('Replying \'404\'' + error)
      }
      return
    }
    throw new Verror(error, 'Can`t get doujin')
  }
  let fixedUrl = doujin.telegraph_fixed_url

  if (!fixedUrl) {
    const pages = await getPages(doujin.id)
  
    if (pages === 404) {
      try {
        await ctx.reply(i18n.__('cant_get_anymore'))
      } catch (error) {
        throw new Verror(error, 'Replying \'404\'')
      }
      return
    }
  
    let attemptsCnt = 0    // count retries because err
    let telegraphUrls: string[] = []
    // in case it isn't the first try to fix manga we dont want to reupload same pages
    if (Array.isArray(doujin.fixed_pages) && doujin.fixed_pages.length) {
      telegraphUrls = uniq(doujin.fixed_pages) // so get them from db
      console.log(
        'here is ' + telegraphUrls.length + ' pages from previous fix'
      )
    }

    for (let i = telegraphUrls.length || 0; i < pages.length; i++) {
      const fixing_keyboard: InlineKeyboardButton[][] = [[]]
      const telegraph_url = doujin.telegraph_url
      // while manga is fixing you can still try to open broken one:
      if (telegraph_url) {
        fixing_keyboard[0].push({
          text: 'Telegra.ph',
          url:  telegraph_url,
        })
      }

      // in case we were retrying after err 3 times - stop it
      if (attemptsCnt > 2) {
        const fixingKeyboardBack: InlineKeyboardButton[][] = await buildKeyboardBack(telegraph_url, doujin.id, callback_query)
        try {
          await ctx.editMessageReplyMarkup({
            inline_keyboard: fixingKeyboardBack,
          })
        } catch (error) {
          console.error('editMessageReplyMarkup while fixing pages stopped trying: ', error)
        }
        return
      }
      let newUrl: uploadResult | undefined
      try {
        newUrl = await uploadByUrl(pages[i])
      } catch (error) {
        console.log(
          'error in uploading image happened on try number ' +
          attemptsCnt +
          '\nerr: ' +
          error
        )
        i -= 1
        attemptsCnt += 1

        fixing_keyboard[0].unshift({
          text:          'flood wait, waiting 10 seconds',
          callback_data: 'flood_wait',
        })
      }

      if (newUrl && newUrl.link) {
        telegraphUrls.push(newUrl.link)
        doujin.fixed_pages.push(newUrl.link) // if err, we won't lose pages
        await doujin.save() // hope there is no limits on the number of requests
      }

      // display the process:
      fixing_keyboard[0].unshift({
        text:          i + 1 + '/' + pages.length + i18n.__('pages_fixed'),
        callback_data: 'fixing',
      })
      try {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: fixing_keyboard,
        })
      } catch (error) {
        console.error('editMessageReplyMarkup while fixing pages: ', error)
      }
      await sleep(5000) // maybe with help
    }

    try {
      fixedUrl = (await telegraphCreatePage(doujin, telegraphUrls)).url
    } catch (error) {
      console.error('Creating fixed telegraph page', error)
    }

    // save new url of course:
    doujin.telegraph_fixed_url = fixedUrl
    // delete all fixed pages cause we already have webpage
    doujin.fixed_pages = []
    try {
      await doujin.save()
    } catch (error) {
      console.error('saving fixed doujin: ', error)
    }
  }

  const heart = user.favorites.includes(doujin.id) ? config.like_button_true : config.like_button_false
  const messageText = getMangaMessage(doujin, fixedUrl)
  const inline_keyboard: InlineKeyboardButton[][] = [
    [
      {
        text: 'Telegra.ph',
        url:  String(fixedUrl),
      },
      {text: heart, callback_data: 'like_' + doujin.id},
    ],
  ]
  if (callback_query.message) {
    inline_keyboard.push([
      {
        text: i18n.__('search_button'),
        switch_inline_query_current_chat: '',
      },
    ])
    inline_keyboard.push([
      {
        text: i18n.__('next_button'),
        callback_data: 'r_prev' + doujin.id
      },
    ])

    const message = await Message.findOne({
      message_id: callback_query.message.message_id,
      chat_id: String(callback_query.message.from?.id),
    })
    if (message && message.current > 0) {
      inline_keyboard[2].unshift({
        text: i18n.__('previous_button'),
        callback_data: 'prev_' + doujin.id,
      })
    }
  }
  console.log('fixed pages! new url: ' + fixedUrl)
  try {
    await ctx.editMessageText(messageText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    })
  } catch (error) {
    console.error('editing message with fixed doujin: ', error)
  }
}

function uniq(a: string[]) {
  const seen: Record<string, boolean> = {}
  return a.filter(function (item) {
    return Object.prototype.hasOwnProperty.call(seen, item) ? false : (seen[item] = true)
  })
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
async function getPages(id: number | string): Promise<string[] | 404> {
  let doujinWithPages: Doujin
  try {
    doujinWithPages = await nhentai.getDoujin(id)
  } catch (error) {
    if (error.message === 'Not found') {
      return 404
    }
    throw new Verror(error, 'Getting doujin to fix pages')
  }
  return doujinWithPages.pages
}

async function buildKeyboardBack(telegraph_url: string | undefined, id: string, callback_query: CallbackQuery.DataCallbackQuery): Promise<InlineKeyboardButton[][]> {
  const fixing_keyboard: InlineKeyboardButton[][] = [[]]

  // while manga is fixing you can still try to open broken one:
  if (telegraph_url) {
    fixing_keyboard[0].push({
      text: 'Telegra.ph',
      url:  telegraph_url,
    })
  }
  fixing_keyboard[0].unshift({
    // button to try again:
    text:          i18n.__('try_again_later'),
    callback_data: 'fixLater_' + id + '_' + new Date(),
  })
  // in case it happen not in inline search we should add buttons back:
  if (callback_query.message) {
    fixing_keyboard.push([
      {
        text: i18n.__('search_button'),
        switch_inline_query_current_chat: '',
      },
    ])
    fixing_keyboard.push([
      {
        text: i18n.__('next_button'),
        callback_data: 'r',
      },
    ])
    const message_db = await Message.findOne({
      message_id: callback_query.message.message_id,
      chat_id:    String(callback_query.message.from?.id),
    })
    if (message_db && message_db.current > 0) {
      fixing_keyboard[2].unshift({
        text:          i18n.__('previous_button'),
        callback_data: 'previous',
      })
    }
  }
  return fixing_keyboard
}