import config from '../../../config'
import {Context} from 'telegraf'
import saveAndGetUser from '../../db/save_and_get_user'
import {Document} from 'mongoose'
import {UserSchema} from '../../models/user.model'
import Verror from 'verror'
import saveAndGetManga from '../../db/save_and_get_manga'
import {MangaSchema} from '../../models/manga.model'
import {getMangaMessage, isFullColor} from '../some_functions'

export default async function openIInTelegraph (ctx: Context) {
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

  try {
    await ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [
          {
            text: i18n.__('waitabit_button'),
            callback_data: 'wait'
          }
        ],
      ],
    })
  } catch (error) {
    console.error('openInTelegraph: Edit buttons before starting: ' + error)
  }

  const mangaId = ctx.update.callback_query.data.split('_')[1];
  let manga: MangaSchema & Document<any, any, MangaSchema> | undefined
  try {
    manga = await saveAndGetManga(user, Number(mangaId))
  } catch (error) {
    if(error.message === 'Not found') {
      try {
        await ctx.reply(i18n.__('manga_does_not_exist') + '\n(' + mangaId + ')')
      } catch (error) {
        console.error('Replying \'404\'' + error)
      }
    }
    throw new Verror(error, 'Getting manga by id')
  }
  const telegraphUrl = manga.telegraph_fixed_url
    ? manga.telegraph_fixed_url
    : manga.telegraph_url

  const heart = user.favorites.includes(manga.id) ? config.like_button_true : config.like_button_false
  const inline_keyboard = [
      [
        {text: 'Telegra.ph', url: String(telegraphUrl)},
        {text: heart, callback_data: 'like_' + manga.id},
      ],
    ],
    messageText = getMangaMessage(manga, telegraphUrl);

  user.manga_history.push(manga.id) // save to history
  await user.save()
  /* if the manga is too big, the telegram might refuse to create an instant view,
     so here is a button that can magically fix that */
  const numberOfPages = manga.pages
  if (!manga.telegraph_fixed_url
    && (numberOfPages > config.pages_to_show_fix_button || isFullColor(manga))) {
    inline_keyboard[0].unshift({
      text:          i18n.__('fix_button'),
      callback_data: 'fix_' + manga.id,
    })
  }
  try {
    await ctx.editMessageText(messageText, {
      parse_mode:   'HTML',
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    })
  } catch (error){
    throw new Verror(error, 'Editing opened in telegraph')
  }
}
