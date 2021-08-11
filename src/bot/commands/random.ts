import {Context} from 'telegraf'
import {UserSchema} from '../../models/user.model'
import {Document} from 'mongoose'
import Message, {MessageSchema} from '../../models/message.model'
import Verror from 'verror'
import {MangaSchema} from '../../models/manga.model'
import saveAndGetManga from '../../db/save_and_get_manga'
import {getMangaMessage, isFullColor} from '../some_functions'
import config from '../../../config'
import {InlineKeyboardButton} from 'typegram'
import i18n from '../../i18n'

import saveAndGetUser from '../../db/save_and_get_user'

async function createMessage(chat_id: string, message_id: string){
  return new Message({
    chat_id:    chat_id,
    message_id: message_id,
    current:    0,
    history:    [],
  })
}
export default async function makeRandom(ctx: Context, mode: 'next' | 'previous'): Promise<void> {
  let user: UserSchema & Document<any, any, UserSchema> | undefined
  try {
    user = await saveAndGetUser(ctx)
  } catch (error) {
    throw new Verror(error, 'Getting user in callbackHandler')
  }

  let message: MessageSchema & Document<any, any, MessageSchema> | null = null

  if (('callback_query' in ctx.update)
    && ctx.update.callback_query.message
    && ctx.update.callback_query.message.from){
    const chat_id = String(ctx.update.callback_query.message.from.id)
    const message_id = ctx.update.callback_query.message.message_id
    try {
      message = await Message.findOne({
        message_id,
        chat_id,
      })
    } catch (error) {
      console.error('Can\'t get a message')
      console.error(error)
    }
    if(!message){
      message = await createMessage(chat_id, String(message_id))
    }
  } else if (ctx.message) {
    message = await createMessage(String(ctx.message.from.id), String(ctx.message.message_id + 1))
  } else {
    throw new Verror('Cant get message_id and chat_id from context')
  }
  let manga: MangaSchema & Document<any, any, MangaSchema> | undefined


  if (mode === 'previous') {
    if (message.current === 0) {
      return
    }
    try {
      manga = await saveAndGetManga(user, message.history[message.current-1])
    } catch (error) {
      throw new Verror('Getting random manga')
    }
    message.current -= 1
  } else
  /* if user at the and of history
     [ 234, 123, 345, 1243, 356]  - history.length === 5
                            usr     current        === 4 */
  // TODO: be able to work without database connection
  if (message.current >= (message.history.length - 1)){
    try {
      manga = await saveAndGetManga(user)
    } catch (error) {
      throw new Verror('Getting random manga')
    }
    message.history.push(manga.id)
    if (message.history.length > 50) {
      // (i have only 500mb bro stop)
      for (let t = message.history.length; t > 50; t--) {
        message.history.shift()
      }
    }
    message.current += 1
  } else
  /* if user previously was clicking back button and he is not at the and of history
     [ 234, 123, 345, 1243, 356]  - history.length === 5
            usr                     current        === 1                             */
  {
    try {
      manga = await saveAndGetManga(user, message.history[message.current])
    } catch (error) {
      throw new Verror('Getting random manga')
    }
    message.current += 1
  }
  user.manga_history.push(manga.id)
  if (user.manga_history.length > 50) {
    // you don't need so much history, do you?
    for (let t = user.manga_history.length; t > 50; t--) {
      user.manga_history.shift()
    }
  }
  await message.save()
  await user.save()

  const telegraphUrl = manga.telegraph_fixed_url
    ? manga.telegraph_fixed_url
    : manga.telegraph_url
  const messageText = getMangaMessage(manga, telegraphUrl)
  const heart = user.favorites.includes(manga.id) ? config.like_button_true : config.like_button_false
  const inline_keyboard: InlineKeyboardButton[][] = [
    [
      { text: 'Telegra.ph', url: String(telegraphUrl) },
      { text: heart, callback_data: 'like_' + manga.id },
    ],
    [
      {
        text: i18n.__('search_button'),
        switch_inline_query_current_chat: '',
      },
    ],
    [
      {
        text: i18n.__('next_button'),
        callback_data: 'r'
      }
    ],
  ]
  const numberOfPages = manga.pages
  if (!manga.telegraph_fixed_url
    && (numberOfPages > config.pages_to_show_fix_button
      || isFullColor(manga))) {
    inline_keyboard[0].unshift({
      text:          i18n.__('fix_button'),
      callback_data: 'fix_' + manga.id,
    })
  }
  if (message.current > 0) {
    inline_keyboard[2].unshift({
      text:          i18n.__('previous_button'),
      callback_data: 'previous',
    })
  }

  // finally!
  if ('callback_query' in ctx.update) {
    try {
      await ctx.editMessageText(messageText, {
        parse_mode:   'HTML',
        reply_markup: {
          inline_keyboard: inline_keyboard,
        },
      })
    } catch (error) {
      throw new Verror(error, 'Editing random manga (->)')
    }
  } else {
    try {
      await ctx.reply(messageText, {
        parse_mode:   'HTML',
        reply_markup: {
          inline_keyboard: inline_keyboard,
        },
      })
    } catch (error) {
      throw new Verror(error, 'Replying with random manga (->)')
    }
  }
}