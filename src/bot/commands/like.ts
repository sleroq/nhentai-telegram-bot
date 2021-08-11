import {Context} from 'telegraf'
import saveAndGetUser from '../../db/save_and_get_user'
import {UserSchema} from '../../models/user.model'
import {Document} from 'mongoose'
import Verror from 'verror'
import saveAndGetManga from '../../db/save_and_get_manga'
import {MangaSchema} from '../../models/manga.model'
import {InlineKeyboardButton} from 'typegram'
import config from '../../../config'
import i18n from '../../i18n'

export default async function likeDoujin (ctx: Context) {
  if(!('callback_query' in ctx.update)
    || !('data' in ctx.update.callback_query)){
    return
  }
  let user: UserSchema & Document<any, any, UserSchema> | undefined
  try {
    user = await saveAndGetUser(ctx)
  } catch (error) {
    throw new Verror(error, 'Getting user in callbackHandler')
  }
  const doujinId = Number(ctx.update.callback_query.data.split('_')[1])
  if(!doujinId){
    throw new Verror('Somehow user is trying to like without id')
  }
  let doujin: MangaSchema & Document<any, any, MangaSchema> | undefined
  try {
    doujin = await saveAndGetManga(user, Number(doujinId))
  } catch (error) {
    if(error.message === 'Not found') {
      try {
        await ctx.reply(i18n.__('manga_does_not_exist') + '\n(' + doujinId + ')')
      } catch (error) {
        throw new Verror(error, 'Replying \'404\'')
      }
      return
    }
    throw new Verror(error, 'Getting manga by id')
  }
  let keyboard: InlineKeyboardButton[][] = []
  if (ctx.update.callback_query.message
   && ('reply_markup' in ctx.update.callback_query.message)
   && ctx.update.callback_query.message.reply_markup) {
    keyboard = ctx.update.callback_query.message.reply_markup.inline_keyboard
  } else {
    keyboard = [
      [
        {
          text: 'Telegra.ph',
          url: String(doujin.telegraph_url)
        },
        {
          text: config.like_button_false,
          callback_data: 'like_' + doujin.id
        },
      ],
    ]
  }

  if (!user.favorites.includes(doujin.id)) {
    user.favorites.push({
      _id: doujin.id,
      title: doujin.title,
      description: doujin.description,
      tags: doujin.tags,
      pages: doujin.pages,
      thumbnail:     String(doujin.thumbnail),
      telegraph_url: String(doujin.telegraph_url),
    })
    try {
      await user.save()
    } catch (error) {
      throw new Verror(error, 'Saving user to like doujin')
    }
    console.log('Added to favorites!')

    keyboard[0][keyboard[0].length - 1].text = config.like_button_true

    try {
      await ctx
        .answerCbQuery('Added to favorites!')
    } catch (error) {
      console.error(error, 'answerCbQuery')
    }
    try {
      await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard })
    } catch (error){
      throw new Verror(error, 'editing like button ')
    }
  } else {
    user.favorites.splice(user.favorites.indexOf(doujin.id), 1)
    try {
      await user.save()
    } catch (error) {
      throw new Verror(error, 'Saving user to like doujin')
    }
    console.log('Removed from favorites!')
    try {
      await ctx.answerCbQuery('Removed from favorites!')
    } catch (error) {
      console.error(error, 'answerCbQuery')
    }
    keyboard[0][keyboard[0].length - 1].text = config.like_button_false
    try {
      await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard })
    } catch (error){
      throw new Verror(error, 'editing like button ')
    }
  }
  console.log(user.favorites.length)
}
