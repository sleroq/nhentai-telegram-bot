import {Context} from 'telegraf'
import config from '../../config'
import saveAndGetManga from '../db/save_and_get_manga'
import {MangaSchema} from '../models/manga.model'
import {Document} from 'mongoose'
import Verror from 'verror'
import {UserSchema} from '../models/user.model'
import saveAndGetUser from '../db/save_and_get_user'
import {getMangaMessage, isFullColor} from '../lib/some_functions'
import Message from '../models/message.model'
import {InlineKeyboardButton} from 'typegram'

// TODO: be able to work without database connection
export default async function textHandler(ctx: Context): Promise<void> {
  if (!ctx.message
    || !('text' in ctx.message)){
    return
  }
  if (((ctx.message.chat.type !== 'private')       // In group chat
    && !('reply_to_message' in ctx.message)        // user not replying bot`s message
    && !(ctx.message.text.includes('@' + ctx.me))) // not mentioning the bot
    || (('via_bot' in ctx.message) &&              // or message was sent via this bot
        (ctx.message.via_bot?.username == ctx.me))
  ) {
    return
  }
  let user: UserSchema & Document<any, any, UserSchema> | undefined
  try {
    user = await saveAndGetUser(ctx)
  } catch (error) {
    throw new Verror(error, 'Getting user in callbackHandler')
  }

  const messageText = ctx.message.text
  // find numbers, remove duplicates:
  const ids = Array.from(new Set(messageText.match(/\d+/gm)))
  if (!ids || !ids[0]) {
    return
  }
  for (const id of ids) {
    if (ids.indexOf(id) > config.maximum_codes_from_one_message) {
      console.log('textHandler: Stop: Reached limit' + config.maximum_codes_from_one_message + ' codes')
      return
    }
    console.log('textHandler started work on ' + id)

    let manga: MangaSchema & Document<any, any, MangaSchema> | undefined
    try {
      manga = await saveAndGetManga(user, Number(id))
    } catch (error) {
      if(error.message === 'Not found') {
        try {
          await ctx.reply(i18n.__('manga_does_not_exist') + '\n(' + id + ')')
        } catch (error) {
          console.error('Replying \'404\'' + error)
        }
      } else {
        try {
          await ctx.reply(i18n.__('failed_to_get') + '\n(`' + id + '`)', {
            parse_mode: 'HTML',
          })
        } catch (error) {
          console.error('Replying \'failed_to_get\'' + error)
        }
      }
      continue
    }

    const telegraph_url = manga.telegraph_fixed_url
      ? manga.telegraph_fixed_url
      : manga.telegraph_url

    const message = new Message({
      chat_id:    ctx.message.from.id,
      message_id: ctx.message.message_id,
      current:    0,
      history:    [],
    })
    const messageText = getMangaMessage(manga, telegraph_url)
    const heart = user.favorites.includes(manga.id) ? '♥️' : '🖤'
    const inlineKeyboard: InlineKeyboardButton[][] = [
      [
        {
          text: 'Telegra.ph',
          url:  String(telegraph_url)
        },
        {
          text:          heart,
          callback_data: 'like_' + manga.id
        },
      ],
      [
        {
          text: i18n.__('search_button'),
          switch_inline_query_current_chat: '',
        },
      ],
      [
        {
          text:          i18n.__('next_button'),
          callback_data: 'r'
        }
      ],
    ]
    const numberOfPages = manga.pages

    if (!manga.telegraph_fixed_url && (numberOfPages > config.pages_to_show_fix_button || isFullColor(manga))) {
      inlineKeyboard[0].unshift({
        text:          i18n.__('fix_button'),
        callback_data: 'fix_' + manga.id,
      })
    }
    message.history.push(manga.id)
    user.manga_history.push(manga.id)
    try {
      await message.save()
    } catch (error){
      console.error('Cant save message: ' + error)
    }
    try {
      await user.save()
    } catch (error){
      console.error('Cant save user: ' + error)
    }

    try {
      await ctx.reply(messageText, {
        parse_mode:   'HTML',
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      })
    } catch (error) {
      console.error('Text handler replying with result ' + error)
    }
    if (ids.indexOf(id) === ids.length - 1) {
      console.log('textHandler finished work')
    }
  }
}