import config from '../../config'
import i18n from '../lib/i18n'
import Verror from 'verror'

import {
  assembleKeyboard,
  getMangaMessage
} from '../lib/some_functions'
import saveAndGetManga from '../db/save_and_get_manga'
import saveAndGetUser  from '../db/save_and_get_user'

import Message   from '../models/message.model'
import { Manga } from '../models/manga.model'
import { User }  from '../models/user.model'
import { Context }              from 'telegraf'

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
  let user: User | undefined
  try {
    user = await saveAndGetUser(ctx)
  } catch (error) {
    throw new Verror(error, 'Getting user in callbackHandler')
  }

  const messageText = ctx.message.text
  // find numbers, remove duplicates:
  const ids = Array.from(new Set(messageText.match(/\d+/gm)))
  if (!ids[0]) {
    return
  }
  for (const id of ids) {
    const index = ids.indexOf(id)
    if (index > config.maximum_codes_from_one_message) {
      console.log('textHandler: Stop: Reached limit' + config.maximum_codes_from_one_message + ' codes')
      return
    }
    console.log('textHandler started work on ' + id)

    let manga: Manga| undefined
    try {
      manga = await saveAndGetManga(user, Number(id))
    } catch (error) {
      if(error.message === 'Not found') {
        try {
          await ctx.reply(i18n.t('manga_does_not_exist') + '\n(' + id + ')')
        } catch (error) {
          console.error('Replying \'404\'' + error)
        }
      } else {
        try {
          await ctx.reply(i18n.t('failed_to_get') + '\n(`' + id + '`)', {
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
      chat_id:    ctx.message.chat.id,
      message_id: ctx.message.message_id + 1 + index,
      current:    0,
      history:    [],
    })
    const messageText = getMangaMessage(manga, telegraph_url)
    const inlineKeyboard = assembleKeyboard(user, manga, telegraph_url)
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