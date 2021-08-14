import nhentai, {Doujin} from '../../lib/nhentai'
import {Context} from 'telegraf'
import {UserSchema} from '../../models/user.model'
import {Document} from 'mongoose'
import saveAndGetUser from '../../db/save_and_get_user'
import Verror from 'verror'
import saveAndGetManga from '../../db/save_and_get_manga'
import {MangaSchema} from '../../models/manga.model'
import {InlineKeyboardButton} from 'typegram'
import i18n from '../../lib/i18n'
import {CallbackQuery} from 'telegraf/typings/core/types/typegram'
import Message, {MessageSchema} from '../../models/message.model'
import { uploadByUrl } from 'telegraph-uploader'
import {telegraphCreatePage} from '../../lib/telegraph'

export default async function fixInstantView(ctx: Context, callback_query: CallbackQuery.DataCallbackQuery) {

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
        await ctx.reply(i18n.__('manga_does_not_exist') + '\n(' + mangaId + ')')
      } catch (error) {
        console.error('Replying \'404\'' + error)
      }
      return
    }
    throw new Verror(error, 'Can`t get doujin')
  }
  let fixedUrl = doujin.telegraph_fixed_url

  if (!fixedUrl) {
    let doujinWithPages: Doujin
    try {
      doujinWithPages = await nhentai.getDoujin(doujin.id)
    } catch (error) {
      if (error.message === 'Not found') {
        try {
          await ctx.reply(i18n.__('cant_get_anymore'))
        } catch (error) {
          throw new Verror(error, 'Replying \'404\'')
        }
        return
      }
      throw new Verror(error, 'Getting doujin to fix pages')
    }
    const pages = doujinWithPages.pages

    let attemptsCnt = 0    // coun't retries because err
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

      // while manga is fixing you can still try to open broken one:
      if(doujin.telegraph_url){
        fixing_keyboard[0].push({
          text: 'Telegra.ph',
          url:  doujin.telegraph_url,
        })
      }
      // incase we were retrying after err 3 times - stop it
      if (attemptsCnt > 2) {
        fixing_keyboard[0].unshift({
          // button to try again:
          text:          i18n.__('try_again_later'),
          callback_data: 'fixLater_' + doujin.id + '_' + new Date(),
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
              text:          i18n.__('next_button'),
              callback_data: 'r',
            },
          ])
          const message_db = await Message.findOne({
            message_id: callback_query.message.message_id,
            chat_id: String(callback_query.message.from?.id),
          })
          if (message_db && message_db.current > 0) {
            fixing_keyboard[2].unshift({
              text:          i18n.__('previous_button'),
              callback_data: 'previous',
            })
          }
        }
        try {
          await ctx.editMessageReplyMarkup({
            inline_keyboard: fixing_keyboard,
          })
        } catch (error) {
          console.error('editMessageReplyMarkup while fixing pages stopped trying: ', error)
        }
        return
      }
      let newUrl: { link: string, path: string } | undefined
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
          text:          'flood wait err',
          callback_data: 'flood_wait',
        })

        await sleep(5000) // idk if it helps
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
        await ctx
          .editMessageReplyMarkup({
            inline_keyboard: fixing_keyboard,
          })
      } catch (error) {
        console.error('editMessageReplyMarkup while fixing pages: ', error)
      }
    }

    try {
      fixedUrl = (await telegraphCreatePage(doujin, telegraphUrls)).url

    } catch (error) {
      console.error('Creating fixed telegraph page', error)
    }

    const keyboard: InlineKeyboardButton[][] = []
    // if there is no url somehow, prevent err, and allow user to return
    if (!fixedUrl) {
      keyboard[0].push({
        text: 'Telegra.ph',
        url:  telegraphUrl,
      })
      if (callback_query.message) {
        keyboard[0].unshift({
          text:          i18n.__('previous_button'),
          callback_data: 'previous',
        })
      }
      await ctx
        .editMessageReplyMarkup({
          inline_keyboard: keyboard,
        })
        .catch((err) => {
          console.log(err)
        })
      return
    }
  }
  // save new url ofcourse:
  manga_db.telegraph_fixed_url = telegraph_fixed_url;
  // delete all fixed pages cause we already have webpage
  manga_db.fixed_pages = [];
  manga_db.save();

  let heart = user.favorites.id(manga.id) ? config.like_button_true : config.like_button_false,
    messageText = getMangaMessage(manga, telegraph_fixed_url, ctx.i18n),
    inline_keyboard = [
      [
        {
          text: "Telegra.ph",
          url: telegraph_fixed_url,
        },
        { text: heart, callback_data: "like_" + manga.id },
      ],
    ];
  if (ctx.update.callback_query.message) {
    inline_keyboard.push([
      {
        text: ctx.i18n.t("search_button"),
        switch_inline_query_current_chat: "",
      },
    ]);
    inline_keyboard.push([
      { text: ctx.i18n.t("next_button"), callback_data: "r_prev" + manga.id },
    ]);
    let message = await Message.findOne({
      message_id: ctx.update.callback_query.message.message_id,
      chat_id: ctx.update.callback_query.message.from.id,
    });
    if (message && message.current > 0) {
      inline_keyboard[2].unshift({
        text: ctx.i18n.t("previous_button"),
        callback_data: "prev_" + manga.id,
      });
    }
  }

  console.log(
    "fixed from this - " + telegraph_url + "\nto this - " + telegraph_fixed_url
  );

  await ctx
    .editMessageText(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    })
    .catch((err) => {
      console.log(err);
    });
};

function uniq(a) {
  var seen = {};
  return a.filter(function (item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}