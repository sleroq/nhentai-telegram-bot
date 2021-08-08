import nhentai, { SearchResult, SortingType } from '../nhentai'
import config from '../../config'
import Verror from 'verror'

import {
  getMessageInline,
  sliceByHalf,
  getMangaMessage,
  isFullColor,
} from './some_functions.js'

import saveAndGetUser from '../db/save_and_get_user'
import saveAndGetManga from '../db/save_and_get_manga'
import Manga, { MangaSchema } from '../models/manga.model.js'
import Context from 'telegraf/typings/context'
import i18n from '../i18n'
import { InlineKeyboardButton, InlineKeyboardMarkup, InlineQueryResultArticle } from 'typegram'
import { Favorite } from '../models/user.model'
import { Document } from 'mongoose'

async function getFavoritesUniversal(favorites: Favorite[], type: 'photo'| 'article') {
  const results = []
  for (const favorite of favorites){
    const caption = getMangaMessage(favorite, favorite.telegraph_url)
    const description = sliceByHalf(favorite.title)
      .replace('<', '\\<')
      .replace('>', '\\>')
      .trim()
    const heart = config.like_button_true
    const InlineKeyboardMarkup: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          {
            text:          i18n.__('fix_button'),
            callback_data: 'fix_' + favorite._id,
          },
          { text: 'Telegra.ph', url: String(favorite.telegraph_url) },
          { text: heart, callback_data: 'like_' + favorite._id },
        ]
      ]
    }
    results.push({
      id:    favorite._id,
      type:  type,
      title: favorite.title
        .replace('<', '\\<')
        .replace('>', '\\>')
        .trim(),
      description: description,
      thumb_url:   favorite.thumbnail,
      photo_url:   favorite.thumbnail,

      input_message_content: {
        message_text: caption,
        parse_mode:   'HTML',
      },
      reply_markup: InlineKeyboardMarkup
    })
  }
  return results
}

export default async function (ctx: Context): Promise<void> {
  const user = await saveAndGetUser(ctx)
  if (!user || !ctx.inlineQuery) {
    return
  }
  let inlineQuery = ctx.inlineQuery.query
  // Favorites: 
  const matchPage = inlineQuery.match(/\/p\d+/g)
  if (
    !inlineQuery
    || (
      matchPage
      && matchPage[0]
      && inlineQuery.replace(matchPage[0], '').trim() === ''
    )
  ) {
    const searchType: 'photo' | 'article' = config.show_favorites_as_gallery ? 'photo' : 'article'
    const favorites = user.favorites

    const favoritesReplyMarkup: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          {
            text:                             i18n.__('favorites'),
            switch_inline_query_current_chat: '',
          },
        ],
      ],
    }
    
    let pageNumber = 1
    const pageNumberMatch = matchPage ? matchPage[0] : undefined // check if page specified

    if (pageNumberMatch) { // for example "@bot /f /p2" 
      pageNumber = Number(pageNumberMatch.slice(2))
      inlineQuery = inlineQuery.replace(pageNumberMatch, '').trim()
    }
    const results = await getFavoritesUniversal(favorites, searchType)
    results.reverse()
    results.splice(0, 48 * (pageNumber - 1))

    if (results.length > 48) {
      const num_of_superfluous = results.length - 48
      results.splice(48, num_of_superfluous)
    }

    const nextPageSwitch = `/p${+pageNumber + 1} ${inlineQuery}`

    results.unshift({
      id:                    String(Math.floor(Math.random() * 10000000)),
      type:                  searchType,
      title:                 i18n.__('favorites'),
      description:           i18n.__('favorites_tip_desctiption'),
      photo_url:             config.favorites_icon_inline,
      thumb_url:             config.favorites_icon_inline,
      input_message_content: {
        message_text: i18n.__('tap_to_open_favorites'),
        parse_mode:   'HTML',
      },
      reply_markup: favoritesReplyMarkup,
    })

    if (pageNumber < Math.ceil(results.length / 48)) {
      results.push({
        id:          String(9696969696),
        type:        searchType,
        title:       i18n.__('next_page_tip_title'),
        description: `TAP HERE or Just add "/p${+pageNumber + 1
        }" to search qerry: (@nhentai_mangabot ${nextPageSwitch})`,
        photo_url:             config.next_page_icon_inline,
        thumb_url:             config.next_page_icon_inline,
        input_message_content: {
          message_text:
            i18n.__('next_page_tip_message'),
          parse_mode: 'HTML',
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text:                             i18n.__('next_page_button'),
                switch_inline_query_current_chat: nextPageSwitch,
              },
            ],
          ],
        },
      })
    }

    try {
      await ctx // @ts-ignore
        .answerInlineQuery(results, {
          cache_time:  0,
          is_personal: true,
        })
    } catch (error) {
      console.log(results)
      throw new Verror(error, 'Answer inline favorites')
    }
    return
  }

  // history
  if (inlineQuery.startsWith('/h')) {
    const searchType = 'article',
      results: InlineQueryResultArticle[] = [],
      history_reply_markup = {
        inline_keyboard: [
          [
            {
              text:                             i18n.__('history_tip_title'),
              switch_inline_query_current_chat: '/h',
            },
          ],
        ],
      }

    if (!Array.isArray(user.manga_history) || user.manga_history.length === 0) {
      // history is empty
      results.push({
        id:                    String(69696969696969),
        type:                  searchType,
        title:                 i18n.__('history_tip_title'),
        description:           i18n.__('history_is_empty'),
        thumb_url:             config.history_icon_inline,
        input_message_content: {
          message_text: i18n.__('tap_to_open_history'),
          parse_mode:   'Markdown',
        },
        reply_markup: history_reply_markup,
      })
      await ctx
        .answerInlineQuery(results, {
          cache_time:  0,
          is_personal: true,
        })
        .catch((err) => console.log(err))
      return
    }

    // get all info about manga from database in the same order 
    const history = await Manga.find({ 'id': { $in: user.manga_history } })
    history.sort(function (a, b) {
      // Sort docs by the order of their _id values in ids.
      return user.manga_history.indexOf(a.id) - user.manga_history.indexOf(b.id)
    })

    for (const doujin of history){
      const message_text = getMangaMessage(
        doujin,
        doujin.telegraph_url,
      )
      const description = sliceByHalf(doujin.title)
      const heart = user.favorites.findIndex(item => item._id === doujin._id) ? config.like_button_true : config.like_button_false
      const inline_keyboard = [
        [
          { text: 'Telegra.ph', url: String(doujin.telegraph_url) },
          { text: heart, callback_data: 'like_' + doujin.id },
        ],
      ]
      if (!doujin.telegraph_fixed_url && (doujin.pages > config.pages_to_show_fix_button || isFullColor(doujin))) {
        inline_keyboard[0].unshift({
          text:          i18n.__('fix_button'),
          callback_data: 'fix_' + doujin.id,
        })
      }
      results.push({
        id:    doujin._id,
        type:  searchType,
        title: doujin.title
        // .split(/\[.*?\]/)
        // .join('')
          .trim(),
        description:           description,
        input_message_content: {
          message_text: message_text,
          parse_mode:   'HTML',
        },
        reply_markup: {
          inline_keyboard: inline_keyboard,
        },
      })
    }
    results.push({
      id:                    String(69696969696969),
      type:                  searchType,
      title:                 i18n.__('history_tip_title'),
      description:           i18n.__('history_tip_desctiption'),
      thumb_url:             config.history_icon_inline,
      input_message_content: {
        message_text: i18n.__('tap_to_open_history'),
        parse_mode:   'Markdown',
      },
      reply_markup: history_reply_markup,
    })
    results.reverse()
    await ctx
      .answerInlineQuery(results, {
        cache_time:  0,
        is_personal: true,
      })
      .catch((err) => console.log(err))
    return
  }

  // search:

  // variables

  let pageNumber = 1
  const pageMatch = matchPage // check if page specified
    ? matchPage[0]
    : undefined

  if (pageMatch) { // for example "@bot /p35 smth" 
    pageNumber = Number(pageMatch.slice(2))
    inlineQuery = inlineQuery.replace(pageMatch, '').trim()
  }
  const searchType: 'photo' | 'article' = user.search_type === 'photo' ? user.search_type : 'article'

  let sortingParametr: SortingType = ''

  const matchSorting = inlineQuery.match(/\/s[pn]/)

  let isSearchModified = false
  if (matchSorting) { // for example "@bot /sp smth"
    isSearchModified = true // need this to add tips based on user's query

    switch (matchSorting[0].slice(2)) {
    case 'popular': 
      sortingParametr = 'popular'
      break
    case 'popular-today':
      sortingParametr = 'popular-today'
      break
    case 'popular-week':
      sortingParametr = 'popular-week'
      break
    case 'date':
      break
    default:
      console.error('Not allowed sorting ' + user.search_sorting)
    }
    inlineQuery = inlineQuery.replace(matchSorting[0], '').trim()
  }

  const nothingIsFound_result: InlineQueryResultArticle = {
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

  // console.log(
  //   'Someone is searching for ' +
  //   inlineQuery +
  //   ' at page ' +
  //   pageNumber +
  //   ' and sorting by ' +
  //   sortingParametr
  // )

  // search for id if there is only numbers in query
  const matchNumbers = inlineQuery.match(/\d+/)
  if (matchNumbers && inlineQuery.replace(/\d+/, '').trim() === '') {
    const manga_id = Number(matchNumbers[0])
    const results = []
    let manga: MangaSchema & Document<any, any, MangaSchema> | undefined
    try {
      manga = await saveAndGetManga(user, manga_id)
    } catch (error) {
    // if nothing is found
      if(error.cause() && error.cause().message === 'Not found') {
        results.push(nothingIsFound_result)
        try {
          await ctx.answerInlineQuery(results).catch((err) => console.log(err))
        } catch (error) {
          throw new Verror(error, 'Answer Inline Nothing is found')
        }
        return
      }
      throw new Verror(error, 'Getting doujin by id inline ' + manga_id)
    }
    const telegraph_url = manga.telegraph_fixed_url
      ? manga.telegraph_fixed_url
      : manga.telegraph_url

    const messageText = getMangaMessage(manga, telegraph_url)
    const inline_keyboard: InlineKeyboardButton[][] = [[{ text: 'Telegra.ph', url: String(telegraph_url) }]]

    if (!manga.telegraph_fixed_url && (manga.pages > config.pages_to_show_fix_button || isFullColor(manga))) {
      inline_keyboard[0].unshift({
        text:          i18n.__('fix_button'),
        callback_data: 'fix_' + manga.id,
      })
    }
    const description = manga.description || sliceByHalf(manga.title)
    if (searchType === 'photo'){
      results.push({
        id:    String(manga.id),
        type:  'photo',
        title: manga.title
          .split(/\[.*?\]/)
          .join('')
          .trim(),
        description:           description,
        thumb_url:             manga.thumbnail,
        photo_url:             manga.page0,
        input_message_content: {
          message_text: messageText,
          parse_mode:   'HTML',
        },
        reply_markup: {
          inline_keyboard: inline_keyboard,
        },
      })
    } else {
      results.push({
        id:    String(manga.id),
        type:  'article',
        title: manga.title
          .split(/\[.*?\]/)
          .join('')
          .trim(),
        description:           description,
        thumb_url:             manga.thumbnail,
        input_message_content: {
          message_text: messageText,
          parse_mode:   'HTML',
        },
        reply_markup: {
          inline_keyboard: inline_keyboard,
        },
      })
    }
  
    try { // @ts-ignore
      await ctx.answerInlineQuery(results)
    } catch (error) {
      throw new Verror(error, 'Answer Inline search by id')
    }
    return
  }
  if (!inlineQuery) {
    /* incase there is only search specifications
       and no actual search query */
    return
  }
    
  const results = []

  let searchResult: SearchResult
  try {
    searchResult = await nhentai
      .search(inlineQuery, pageNumber, sortingParametr)
  } catch (error) {
    throw new Verror(error, 'Searching inline')
  }
  if (searchResult.totalSearchResults === 0){
    results.push(nothingIsFound_result)
    try {
      await ctx.answerInlineQuery(results).catch((err) => console.log(err))
    } catch (error) {
      throw new Verror(error, 'Answer Inline Nothing is found')
    }
    return
  }
  const doujins = searchResult.results
  for (const doujin of doujins) {
    const message_text = getMessageInline(doujin)
    const description = doujin.language || sliceByHalf(String(doujin.title))
    results.push({
      id:    doujin.id,
      type:  searchType,
      title: String(doujin.title)
        .split(/\[.*?\]/)
        .join('')
        .trim(),
      description:           description,
      thumb_url:             doujin.thumbnail,
      photo_url:             doujin.thumbnail,
      input_message_content: {
        message_text: message_text,
        parse_mode:   'HTML',
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text:          'Open',
              callback_data: 'open_' + doujin.id,
            },
          ],
        ],
      }
    })
  }
  // Tips and buttons to help user with search:

  const reverseSortingWord =
      sortingParametr.includes('popular') ? 'new' : 'popularity',
    reverseSortingPhotoUrl =
      sortingParametr.includes('popular')
        ? config.sort_by_new_icon_inline
        : config.sort_by_popular_icon_inline,
    sorting_tip_title = sortingParametr == 'popular' ? i18n.__('sorting_by_new_tip_title') : i18n.__('sorting_by_popularity_tip_title'),
    reverseSortingParametr = reverseSortingWord.charAt(0),
    searchSortingSwitch = pageNumber > 1
      ? `/p${pageNumber} /s${reverseSortingParametr} ${inlineQuery}`
      : `/s${reverseSortingParametr} ${inlineQuery}`

  results.unshift({
    id:                    69696969420,
    type:                  searchType,
    title:                 sorting_tip_title,
    description:           `Just add "/s${reverseSortingParametr}" to search qerry: (@nhentai_mangabot ${searchSortingSwitch})`,
    photo_url:             reverseSortingPhotoUrl,
    thumb_url:             reverseSortingPhotoUrl,
    input_message_content: {
      message_text:
          'To sort search results by ' +
          reverseSortingWord +
          ' you can *add /s' +
          reverseSortingParametr +
          '*',
      parse_mode: 'Markdown',
    },
    reply_markup: {
      inline_keyboard: [
        [
          {
            text:                             'Sort by ' + reverseSortingWord,
            switch_inline_query_current_chat: searchSortingSwitch,
          },
        ],
      ],
    },
  })
  const sortingParametrLetter = sortingParametr == 'popular' ? 'p' : 'n',
    nextPageSwitch = isSearchModified
      ? `/p${+pageNumber + 1} /s${sortingParametrLetter} ${inlineQuery}`
      : `/p${+pageNumber + 1} ${inlineQuery}`
  results.push({
    id:          9696969696,
    type:        searchType,
    title:       i18n.__('next_page_tip_title'),
    description: `TAP HERE or Just add "/p${+pageNumber + 1
    }" to search qerry: (@nhentai_mangabot ${nextPageSwitch})`,
    photo_url:             config.next_page_icon_inline,
    thumb_url:             config.next_page_icon_inline,
    input_message_content: {
      message_text: i18n.__('next_page_tip_message'),
      parse_mode:   'Markdown',
    },
    reply_markup: {
      inline_keyboard: [
        [
          {
            text:                             i18n.__('next_page_button'),
            switch_inline_query_current_chat: nextPageSwitch,
          },
        ],
      ],
    },
  })
  try {
    // @ts-ignore
    await ctx.answerInlineQuery(results)
  } catch (error) {
    throw new Verror(error, 'Anser inline search')
  }
}
