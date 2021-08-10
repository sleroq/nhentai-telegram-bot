import Context from 'telegraf/typings/context'
import config  from '../../../config'
import i18n 	 from '../../i18n'
import Verror  from 'verror'

import { getMangaMessage, isFullColor, sliceByHalf } from '../some_functions'

import {
  InlineQueryResultArticle,
  InlineQueryResultPhoto,
  InlineKeyboardButton
} 					   from 'typegram'
import { Document }    from 'mongoose'
import { UserSchema }  from '../../models/user.model'
import { MangaSchema } from '../../models/manga.model'
import saveAndGetManga from '../../db/save_and_get_manga'
import {InlineQueryResult} from 'typegram/inline'

const nothingIsFoundResult: InlineQueryResultArticle = {
  id:                    String(6969696969),
  type:                  'article',
  title:                 i18n.__('nothing_is_found'),
  description:           '',
  thumb_url:             config.help_icon_inline,
  input_message_content: {
    message_text: i18n.__('help'),
    parse_mode:   'Markdown',
  },
  reply_markup: {
    inline_keyboard: [
      [
        {
          text:          i18n.__('search_tips_button'),
          callback_data: 'searchtips',
        },
      ],
      [{ text: i18n.__('settings_button'), callback_data: 'settings' }],
    ],
  },
}

export default async function replyWithFavoritesInline(
  ctx: Context,
  inlineQuery: string,
  user: UserSchema & Document<any, any, UserSchema>,
  mangaId: number
): Promise<void> {
  let doujin: MangaSchema & Document<any, any, MangaSchema> | undefined
  try {
    doujin = await saveAndGetManga(user, mangaId)
  } catch (error) {
    // if nothing is found
    if(error.cause() && error.cause().message === 'Not found') {
      const results: InlineQueryResultArticle[] = []
      results.push(nothingIsFoundResult)
      try {
        await ctx.answerInlineQuery(results).catch((err) => console.log(err))
      } catch (error) {
        throw new Verror(error, 'Answer Inline Nothing is found')
      }
      return
    }
    throw new Verror(error, 'Getting doujin by id inline ' + mangaId)
  }
  
  const searchType: 'photo' | 'article' = config.show_favorites_as_gallery ? 'photo' : 'article'

  if (searchType === 'photo') {
    const results: InlineQueryResult[] = await getDoujinUniversal(doujin)
    results.forEach((result)=>{
      result.type = 'photo'
    })
    try {
      await ctx.answerInlineQuery(results, {
        cache_time:  0,
        is_personal: true,
      })
    } catch (error){
      throw new Verror(error, 'Answer Inline Search by id Photo')
    }
  } else {
    const results: InlineQueryResult[] = await getDoujinUniversal(doujin)
    results.forEach((result)=>{
      result.type = 'article'
    })
    try {
      await ctx.answerInlineQuery(results, {
        cache_time:  0,
        is_personal: true,
      })
    } catch (error){
      throw new Verror(error, 'Answer Inline Search by id Article')
    }
  }

}

async function getDoujinUniversal (
  doujin: MangaSchema & Document<any, any, MangaSchema>
): Promise<InlineQueryResult[]> {
  const results: InlineQueryResult[] = []

  const telegraph_url = doujin.telegraph_fixed_url
    ? doujin.telegraph_fixed_url
    : doujin.telegraph_url

  const messageText = getMangaMessage(doujin, telegraph_url)
  const inline_keyboard: InlineKeyboardButton[][] = [[{ text: 'Telegra.ph', url: String(telegraph_url) }]]

  if (!doujin.telegraph_fixed_url && (doujin.pages > config.pages_to_show_fix_button || isFullColor(doujin))) {
    inline_keyboard[0].unshift({
      text:          i18n.__('fix_button'),
      callback_data: 'fix_' + doujin.id,
    })
  }
  const description = doujin.description || sliceByHalf(doujin.title)
  results.push({
    id:    String(doujin.id),
    type:  'photo',
    title: doujin.title
      .replace('<', '\\<')
      .replace('>', '\\>')
      .trim(),
    description: description
      .replace('<', '\\<')
      .replace('>', '\\>')
      .trim(),
    thumb_url:             String(doujin.thumbnail),
    photo_url:             String(doujin.page0),
    input_message_content: {
      message_text: messageText,
      parse_mode:   'HTML',
    },
    reply_markup: {
      inline_keyboard: inline_keyboard,
    },
  })
  return results
}