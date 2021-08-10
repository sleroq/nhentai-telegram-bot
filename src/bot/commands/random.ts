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

async function createMessage(chat_id: string, message_id: string){
  return new Message({
    chat_id:    chat_id,
    message_id: message_id,
    current:    0,
    history:    [],
  })
}
export default async function makeRandom(ctx: Context, user: UserSchema & Document<any, any, UserSchema>): Promise<void> {
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
  } else if ('message' in ctx.update) {
    message = await createMessage(String(ctx.update.message.from.id), String(ctx.update.message.message_id + 1))
  } else {
    throw new Verror('Cant get message_id and chat_id from context')
  }
  let manga: MangaSchema & Document<any, any, MangaSchema> | undefined

  /* if user at the and of history
    [ 234, 123, 345, 1243, 356]  - history.length === 5
                           usr     current        === 4                                     */
  if (message.current === (message.history.length - 1)){
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
    /* if user previously was clicking back button and he is not at the and of history
    [ 234, 123, 345, 1243, 356]  - history.length === 5
           usr                     current        === 1                                     */
  } else {
    try {
      manga = await saveAndGetManga(user, message.history[message.current])
    } catch (error) {
      throw new Verror('Getting random manga')
    }
    message.current -= 1
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
        callback_data: 'r_' + manga.id
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
      callback_data: 'prev_' + manga.id,
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