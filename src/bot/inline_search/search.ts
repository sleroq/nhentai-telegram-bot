import Context from 'telegraf/typings/context'
import config  from '../../../config'
import i18n    from '../../lib/i18n'
import Werror  from '../../lib/error'

import { getMangaMessage, getMessageInline, sliceByHalf, tagString } from '../../lib/some_functions'

import nHentai, {
	Doujin,
	LightDoujin,
	SearchResult,
	SortingType
}                                   from '../../lib/nhentai'
import { InlineQueryResultArticle } from 'typegram'
import { User }                     from '../../models/user.model'
import { InlineQueryResult }        from 'typegram/inline'

const nothingIsFoundResult: InlineQueryResultArticle = {
	id:          String(6969696969),
	type:        'article',
	title:       i18n.t('nothing_is_found'),
	description: '',
	thumb_url:   config.help_icon_inline,

	input_message_content: {
		message_text: i18n.t('help'),
		parse_mode:   'Markdown',
	},
	reply_markup: {
		inline_keyboard: [
			[
				{
					text:          i18n.t('search_tips_button'),
					callback_data: 'searchtips',
				},
			],
			[{ text: i18n.t('settings_button'), callback_data: 'settings' }],
		],
	},
}

export default async function replyWithSearchInline(
	ctx: Context,
	inlineQuery: string,
	specifiedPage: number | undefined,
	user: User
): Promise<void> {
	let searchType: 'photo' | 'article' = config.show_favorites_as_gallery ? 'photo' : 'article'

	if (user.search_type) {
		if (user.search_type === 'photo') {
			searchType = 'photo'
		} else {
			searchType = 'article'
		}
	}

	const pageNumber = specifiedPage || 1
	inlineQuery = inlineQuery.replace(/\/p\d+/g, '').trim()

	let sortingParameter: SortingType = ''
	const matchSorting = inlineQuery.match(/\/s[pn]/)
	let isSearchModified = false

	if (user.search_sorting) {
		switch (user.search_sorting) {
		case 'popular':
			sortingParameter = 'popular'
			break
		case 'popular-today':
			sortingParameter = 'popular-today'
			break
		case 'popular-week':
			sortingParameter = 'popular-week'
			break
		case 'date':
		case 'new':
			sortingParameter = ''
			break
		default:
			console.error('Strange sorting parameter in user`s settings ' + user.search_sorting)
		}
	}
	if (matchSorting) {       // for example "@bot /sp smth"
		isSearchModified = true // need this to add tips based on user's query

		switch (matchSorting[0].slice(2).trim()) {
		case 'p': 
			sortingParameter = 'popular'
			break
		case 'pt':
			sortingParameter = 'popular-today'
			break
		case 'pw':
			sortingParameter = 'popular-week'
			break
		case 'n':
		case 'd':
			sortingParameter = ''
			break
		default:
			console.error('Not allowed sorting \'' + matchSorting[0].slice(2).trim() + '\'')
		}

		inlineQuery = inlineQuery.replace(matchSorting[0], '').trim()
	}

	if (!inlineQuery) {
		return
	}

	let searchResult: SearchResult<LightDoujin> | SearchResult<Doujin>
	try {
		searchResult = await nHentai.searchApi(inlineQuery, pageNumber, sortingParameter)
		// nhentai`s api is not reliable (sometimes gives false 404) So fallback on webpage scraping
	} catch (error) {
		console.error(error)
		try {
			searchResult = await nHentai.search(inlineQuery, pageNumber, sortingParameter)
		} catch (err) {
			throw new Werror(err, 'Searching inline')
		}
	}
	if (searchResult.totalSearchResults === 0){
		try {
			await ctx.answerInlineQuery([nothingIsFoundResult])
		} catch (error) {
			throw new Werror(error, 'Answer Inline Nothing is found')
		}
		return
	}

	if (searchType === 'photo') {
		const results: InlineQueryResult[] = await getResultsUniversal(user, searchResult.results, inlineQuery, isSearchModified, sortingParameter, pageNumber)
		results.forEach((result)=>{
			result.type = 'photo'
		})
		try {
			await ctx.answerInlineQuery(results)
		} catch (error){
			throw new Werror(error, 'Answer Inline Favorites Photo')
		}
	} else {
		const results: InlineQueryResult[] = await getResultsUniversal(user, searchResult.results, inlineQuery, isSearchModified, sortingParameter, pageNumber)
		results.forEach((result)=>{
			result.type = 'article'
		})
		try {
			await ctx.answerInlineQuery(results, {
				cache_time:  900,
				is_personal: true,
			})
		} catch (error){
			throw new Werror(error, 'Answer Inline Favorites Article')
		}
	}
}

async function getResultsUniversal(
	user: User,
	doujins: LightDoujin[] | Doujin[],
	inlineQuery: string,
	isSearchModified: boolean,
	sortingParameter: SortingType,
	pageNumber: number
): Promise<InlineQueryResult[]> {
	const results: InlineQueryResult[] = []
	for (const doujin of doujins) {
		let message_text: string
		let description: string
		let thumbnail: string
		let title: string
		if ('pages' in doujin) {
			message_text = getMangaMessage(doujin)
			description = `${doujin.pages.length} ${i18n.t('pages')}. ${tagString(doujin)}`
			thumbnail = doujin.thumbnails[0]
			title = doujin.title.translated.pretty ||'Nice Title'
		} else {
			message_text = getMessageInline(doujin)
			description = doujin.language || sliceByHalf(String(doujin.title))
			thumbnail = doujin.thumbnail || 'https://static.nhentai.net/img/logo.090da3be7b51.svg'
			title = doujin.title || 'Nice Title'
		}

		results.push({
			id:    String(doujin.id),
			type:  'photo',
			title: title
				.replace(/</g, '\\<')
				.replace(/>/g, '\\>')
				.trim(),
			description: description
				.replace(/</g, '\\<')
				.replace(/>/g, '\\>')
				.trim(),

			thumb_url: thumbnail,
			photo_url: thumbnail,

			input_message_content: {
				message_text: message_text,
				parse_mode:   'HTML',
			},
			reply_markup: {
				inline_keyboard: [
					[
						{
							text:          i18n.t('open'),
							callback_data: 'open_' + doujin.id,
						},
					],
				],
			}
		})
	}
	// Tips and buttons to help user with search:

	const reverseSortingWord =
			sortingParameter.includes('popular') ? 'new' : 'popularity',
		reverseSortingPhotoUrl =
			sortingParameter.includes('popular')
				? config.sort_by_new_icon_inline
				: config.sort_by_popular_icon_inline,
		sorting_tip_title = sortingParameter == 'popular' ? i18n.t('sorting_by_new_tip_title') : i18n.t('sorting_by_popularity_tip_title'),
		reverseSortingParameter = reverseSortingWord.charAt(0),
		searchSortingSwitch = pageNumber > 1
			? `/p${pageNumber} /s${reverseSortingParameter} ${inlineQuery}`
			: `/s${reverseSortingParameter} ${inlineQuery}`

	results.unshift({
		id:          String(69696969420),
		type:        'photo',
		title:       sorting_tip_title,
		description: i18n.t('sorting_tip_slim', { reverseSortingWord }) + `(@${config.bot_username} ${searchSortingSwitch})`,
		
		photo_url: reverseSortingPhotoUrl,
		thumb_url: reverseSortingPhotoUrl,
		
		input_message_content: {
			message_text: i18n.t('sorting_tip', { reverseSortingWord, reverseSortingParameter: reverseSortingParameter }),
			parse_mode:   'HTML',
		},
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: 'Sort by ' + reverseSortingWord,
						switch_inline_query_current_chat: searchSortingSwitch,
					},
				],
			],
		},
	})
	const sortingParameterLetter = sortingParameter == 'popular' ? 'p' : 'n',
		nextPageSwitch = isSearchModified
			? `/p${pageNumber + 1} /s${sortingParameterLetter} ${inlineQuery}`
			: `/p${pageNumber + 1} ${inlineQuery}`
	results.push({
		id:          String(9696969696),
		type:        'photo',
		title:       i18n.t('next_page_tip_title'),
		description: i18n.t('next_page_tip', { pageNumber: pageNumber + 1 }) + `(@${config.bot_username} ${nextPageSwitch})`,
		
		photo_url: config.next_page_icon_inline,
		thumb_url: config.next_page_icon_inline,
		
		input_message_content: {
			message_text: i18n.t('next_page_tip_message'),
			parse_mode:   'HTML',
		},
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: i18n.t('next_page_button'),
						switch_inline_query_current_chat: nextPageSwitch,
					},
				],
			],
		},
	})
	return results
}