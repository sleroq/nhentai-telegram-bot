// import nhentai from '../nhentai'
import config from '../../config'

import {
  // getMessageInline,
  sliceByHalf,
  getMangaMessage,
  // isFullColor,
} from './some_functions.js'

import saveAndGetUser from '../db/save_and_get_user'
// import saveAndGetManga from '../db/save_and_get_manga'
import Manga from '../models/manga.model.js'
import Context from 'telegraf/typings/context'
import i18n from '../i18n'
import { InlineKeyboardMarkup, InlineQueryResultArticle } from 'typegram'
import { Favorite } from '../models/user.model'

async function getFavoritesUniversal(favorites: Favorite[], type: 'article' | 'photo') {
  const results = []
  for (const favorite of favorites){
    const caption = getMangaMessage(
      favorite,
      favorite.telegraph_url
    )
    const description = sliceByHalf(favorite.title)
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
      // .split(/\[.*?\]/)
      // .join('')
        .trim(),
      // caption,
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
      type:                  'photo',
      title:                 i18n.__('favorites'),
      description:           i18n.__('favorites_tip_desctiption'),
      photo_url:             config.favorites_icon_inline,
      thumb_url:             config.favorites_icon_inline,
      input_message_content: {
        message_text: i18n.__('tap_to_open_favorites'),
        parse_mode:   'Markdown',
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
          parse_mode: 'Markdown',
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

    await ctx // @ts-ignore
      .answerInlineQuery(results, {
        cache_time:  0,
        is_personal: true,
      })
      .catch((err) => console.log(err))
    return
  }
  // results = favorites.map((manga) => ({
  //   id:    Math.floor(Math.random() * 10000000),
  //   type:  searchType,
  //   title: manga.title
  //     .split(/\[.*?\]/)
  //     .join('')
  //     .trim(),
  //   description: manga.description,
  //   thumb_url:   manga.thumbnail,
  //   photo_url:   manga.thumbnail,

  //   input_message_content: {
  //     message_text: manga.message_text,
  //     parse_mode:   'HTML',
  //   },
  //   reply_markup: {
  //     inline_keyboard: manga.inline_keyboard,
  //   },
  // }))
  // results.reverse()
  // //splice pages some pages
  // results.splice(0, 48 * (pageNumber - 1))
  // // rm old favorites cause of telegram limit
  // if (results.length > 48) {
  //   const num_of_superfluous = results.length - 48
  //   results.splice(48, num_of_superfluous)
  // }
  // const nextPageSwitch = `/p${+pageNumber + 1} ${inlineQuery}`
  // results.unshift({
  //   id:                    Math.floor(Math.random() * 10000000),
  //   type:                  searchType,
  //   title:                 ctx.i18n.t('favorites'),
  //   description:           ctx.i18n.t('favorites_tip_desctiption'),
  //   photo_url:             config.favorites_icon_inline,
  //   thumb_url:             config.favorites_icon_inline,
  //   input_message_content: {
  //     message_text: ctx.i18n.t('tap_to_open_favorites'),
  //     parse_mode:   'Markdown',
  //   },
  //   reply_markup: favorites_reply_markup,
  // })
  // if (pageNumber < Math.ceil(results.length / 48)) {
  //   results.push({
  //     id:          9696969696,
  //     type:        searchType,
  //     title:       ctx.i18n.t('next_page_tip_title'),
  //     description: `TAP HERE or Just add "/p${+pageNumber + 1
  //     }" to search qerry: (@nhentai_mangabot ${nextPageSwitch})`,
  //     photo_url:             config.next_page_icon_inline,
  //     thumb_url:             config.next_page_icon_inline,
  //     input_message_content: {
  //       message_text:
  //         ctx.i18n.t('next_page_tip_message'),
  //       parse_mode: 'Markdown',
  //     },
  //     reply_markup: {
  //       inline_keyboard: [
  //         [
  //           {
  //             text:                             ctx.i18n.t('next_page_button'),
  //             switch_inline_query_current_chat: nextPageSwitch,
  //           },
  //         ],
  //       ],
  //     },
  //   })
  // }
  // }

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
      const description = sliceByHalf(history[i].title)
      const heart = user.favorites.id(history[i].id) ? config.like_button_true : config.like_button_false
    }
    for (let i = 0; i < history.length; i++) {
      history[i].description = sliceByHalf(history[i].title)
      const heart = user.favorites.id(history[i].id) ? config.like_button_true : config.like_button_false
      history[i].inline_keyboard = [
        [
          { text: 'Telegra.ph', url: history[i].telegraph_url },
          { text: heart, callback_data: 'like_' + history[i].id },
        ],
      ]
      if (!history[i].telegraph_fixed_url && (history[i].pages > config.pages_to_show_fix_button || isFullColor(history[i]))) {
        history[i].inline_keyboard[0].unshift({
          text:          ctx.i18n.t('fix_button'),
          callback_data: 'fix_' + history[i].id,
        })
      }
    }

    results = history.map((manga) => ({
      id:    Math.floor(Math.random() * 10000000),
      type:  searchType,
      title: manga.title
        .split(/\[.*?\]/)
        .join('')
        .trim(),
      description: manga.description,
      thumb_url:   manga.thumbnail,
      photo_url:   manga.thumbnail,

      input_message_content: {
        message_text: manga.message_text,
        parse_mode:   'HTML',
      },
      reply_markup: {
        inline_keyboard: manga.inline_keyboard,
      },
    }))
    results.push({
      id:                    69696969696969,
      type:                  searchType,
      title:                 ctx.i18n.t('history_tip_title'),
      description:           ctx.i18n.t('history_tip_desctiption'),
      photo_url:             config.history_icon_inline,
      thumb_url:             config.history_icon_inline,
      input_message_content: {
        message_text: ctx.i18n.t('tap_to_open_history'),
        parse_mode:   'Markdown',
      },
      reply_markup: history_reply_markup,
    })
    await ctx
      .answerInlineQuery(results.reverse(), {
        cache_time:  0,
        is_personal: true,
      })
      .catch((err) => console.log(err))
    return
  }

  // // search:

  // // variables

  // let inlineQuery = ctx.inlineQuery.query,
  //   pageNumber = 1,
  //   pageMatch = inlineQuery.match(/\/p\d+/g) // check if page specified
  //     ? inlineQuery.match(/\/p\d+/g)[0]
  //     : undefined,
  //   isPageModified = false,
  //   searchType = user.search_type ? user.search_type : 'article'
  // if (pageMatch) { // for example "@bot /p35 smth" 
  //   isPageModified = true // need this to add tips based on user's query
  //   pageNumber = pageMatch.slice(2)
  //   inlineQuery = inlineQuery.replace(pageMatch, '').trim()
  // }
  // let sortingParametr = user.search_sorting ? user.search_sorting : 'date',
  //   sortMatch = inlineQuery.match(/\/s[pn]/) // check if results order specified
  //     ? inlineQuery.match(/\/s[pn]/)[0]
  //     : undefined,
  //   isSearchModified = false
  // if (sortMatch) { // for example "@bot /sp smth"
  //   isSearchModified = true // need this to add tips based on user's query
  //   sortingParametr = sortMatch.slice(2) == 'p' ? 'popular' : 'date'
  //   inlineQuery = inlineQuery.replace(sortMatch, '').trim()
  // }
  // const nothingIsFound_result = {
  //   id:                    6969696969,
  //   type:                  searchType,
  //   title:                 ctx.i18n.t('nothing_is_found'),
  //   description:           '',
  //   photo_url:             config.help_icon_inline,
  //   thumb_url:             config.help_icon_inline,
  //   input_message_content: {
  //     message_text: ctx.i18n.t('help'),
  //     parse_mode:   'Markdown',
  //   },
  //   reply_markup: {
  //     inline_keyboard: [
  //       [
  //         {
  //           text:          ctx.i18n.t('search_tips_button'),
  //           callback_data: 'searchtips',
  //         },
  //       ],
  //       [{ text: ctx.i18n.t('settings_button'), callback_data: 'settings' }],
  //     ],
  //   },
  // }

  // console.log(
  //   'Someone is searching for ' +
  //   inlineQuery +
  //   ' at page ' +
  //   pageNumber +
  //   ' and sorting by ' +
  //   sortingParametr
  // )

  // // search for id if there is only numbers in query

  // if (inlineQuery.match(/\d+/) && inlineQuery.replace(/\d+/, '').trim() === '') {
  //   const manga_id = inlineQuery.match(/\d+/)[0]
  //   let result = [],
  //     telegraph_url,
  //     manga = await saveAndGetManga(manga_id)
  //   // if nothing is found
  //   if (!manga || manga == 404) {
  //     result.push(nothingIsFound_result)
  //     await ctx.answerInlineQuery(result).catch((err) => console.log(err))
  //     return
  //   }
  //   telegraph_url = manga.telegraph_fixed_url
  //     ? manga.telegraph_fixed_url
  //     : manga.telegraph_url

  //   const messageText = getMangaMessage(manga, telegraph_url, ctx.i18n),
  //     inline_keyboard = [[{ text: 'Telegra.ph', url: telegraph_url }]]

  //   if (!manga.telegraph_fixed_url && (manga.pages > config.pages_to_show_fix_button || isFullColor(manga))) {
  //     inline_keyboard[0].unshift({
  //       text:          ctx.i18n.t('fix_button'),
  //       callback_data: 'fix_' + manga.id,
  //     })
  //   }
  //   let description
  //   // show manga language in the description if any
  //   if (manga.details &&
  //     Array.isArray(manga.details.languages) &&
  //     manga.details.languages.length !== 0
  //   ) {
  //     description = ''
  //     for (let t = 0; t < manga.details.languages.length - 1; t++) {
  //       description += manga.details.languages[t] + ' '
  //     }
  //   } else {
  //     description = sliceByHalf(manga.title)
  //   }
  //   result.push({
  //     id:    manga.id,
  //     type:  searchType,
  //     title: manga.title
  //       .split(/\[.*?\]/)
  //       .join('')
  //       .trim(),
  //     description:           description,
  //     thumb_url:             manga.thumbnail,
  //     photo_url:             manga.page0,
  //     input_message_content: {
  //       message_text: messageText,
  //       parse_mode:   'HTML',
  //     },
  //     reply_markup: {
  //       inline_keyboard: inline_keyboard,
  //     },
  //   })
  //   await ctx.answerInlineQuery(result).catch((err) => console.log(err))
  //   return
  // }
  // if (!inlineQuery) {
  //   /* incase there is only search specifications
  //      and no actual search query */
  //   return
  // }
  // const search = await nhentai
  //   .search(inlineQuery, pageNumber, sortingParametr)
  //   .catch((err) => {
  //     console.log('search error in inline_search')
  //     console.log(err)
  //   })
  // if (!search) {
  //   // if err or something
  //   console.log('!search in inline_search - return')
  //   return
  // }
  // const books = search.results
  // let results = []
  // if (books && books.length) {
  //   // incase we found something

  //   for (let i = 0; i < books.length; i++) {
  //     /* it's in for loop and not in .map below
  //        because maybe there will be promises */
  //     books[i].message_text = getMessageInline(books[i])
  //     books[i].description = books[i].language
  //       ? books[i].language
  //       : sliceByHalf(books[i].title)
  //   }

  //   results = books.map((manga) => ({
  //     id:    manga.id,
  //     type:  searchType,
  //     title: manga.title
  //       .split(/\[.*?\]/)
  //       .join('')
  //       .trim(),
  //     description:           manga.description,
  //     thumb_url:             manga.thumbnail,
  //     photo_url:             manga.thumbnail,
  //     input_message_content: {
  //       message_text: manga.message_text,
  //       parse_mode:   'HTML',
  //     },
  //     reply_markup: {
  //       inline_keyboard: [
  //         [
  //           {
  //             text:          'Open',
  //             callback_data: 'open_' + manga.id,
  //           },
  //         ],
  //       ],
  //     },
  //   }))
  //   // Tips and buttons to help user with search:

  //   const reverseSortingWord =
  //     sortingParametr == 'popular' ? 'new' : 'popularity',
  //     reverseSortingPhotoUrl =
  //       sortingParametr == 'popular'
  //         ? config.sort_by_new_icon_inline
  //         : config.sort_by_popular_icon_inline,
  //     sorting_tip_title = sortingParametr == 'popular' ? ctx.i18n.t('sorting_by_new_tip_title') : ctx.i18n.t('sorting_by_popularity_tip_title'),
  //     reverseSortingParametr = reverseSortingWord.charAt(0),
  //     searchSortingSwitch = isPageModified
  //       ? `/p${pageNumber} /s${reverseSortingParametr} ${inlineQuery}`
  //       : `/s${reverseSortingParametr} ${inlineQuery}`

  //   results.unshift({
  //     id:                    69696969420,
  //     type:                  searchType,
  //     title:                 sorting_tip_title,
  //     description:           `Just add "/s${reverseSortingParametr}" to search qerry: (@nhentai_mangabot ${searchSortingSwitch})`,
  //     photo_url:             reverseSortingPhotoUrl,
  //     thumb_url:             reverseSortingPhotoUrl,
  //     input_message_content: {
  //       message_text:
  //         'To sort search results by ' +
  //         reverseSortingWord +
  //         ' you can *add /s' +
  //         reverseSortingParametr +
  //         '*',
  //       parse_mode: 'Markdown',
  //     },
  //     reply_markup: {
  //       inline_keyboard: [
  //         [
  //           {
  //             text:                             'Sort by ' + reverseSortingWord,
  //             switch_inline_query_current_chat: searchSortingSwitch,
  //           },
  //         ],
  //       ],
  //     },
  //   })
  //   const sortingParametrLetter = sortingParametr == 'popular' ? 'p' : 'n',
  //     nextPageSwitch = isSearchModified
  //       ? `/p${+pageNumber + 1} /s${sortingParametrLetter} ${inlineQuery}`
  //       : `/p${+pageNumber + 1} ${inlineQuery}`
  //   results.push({
  //     id:          9696969696,
  //     type:        searchType,
  //     title:       ctx.i18n.t('next_page_tip_title'),
  //     description: `TAP HERE or Just add "/p${+pageNumber + 1
  //     }" to search qerry: (@nhentai_mangabot ${nextPageSwitch})`,
  //     photo_url:             config.next_page_icon_inline,
  //     thumb_url:             config.next_page_icon_inline,
  //     input_message_content: {
  //       message_text: ctx.i18n.t('next_page_tip_message'),
  //       parse_mode:   'Markdown',
  //     },
  //     reply_markup: {
  //       inline_keyboard: [
  //         [
  //           {
  //             text:                             ctx.i18n.t('next_page_button'),
  //             switch_inline_query_current_chat: nextPageSwitch,
  //           },
  //         ],
  //       ],
  //     },
  //   })
  // } else {
  //   results.push(nothingIsFound_result)
  // }
  // await ctx.answerInlineQuery(results).catch((err) => console.log(err))
}
