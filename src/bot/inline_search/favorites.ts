import Context from 'telegraf/typings/context'
import config  from '../../../config'
import i18n    from '../../lib/i18n'
import Werror  from '../../lib/error'

import { getMangaMessage, sliceByHalf } from '../../lib/some_functions'

import { InlineKeyboardMarkup } from 'typegram'
import { User }                 from '../../models/user.model'
import { InlineQueryResult }    from 'typegram/inline'

const favoritesReplyMarkup: InlineKeyboardMarkup = {
	inline_keyboard: [
		[
			{
				text:                             i18n.t('favorites'),
				switch_inline_query_current_chat: '',
			},
		],
	],
}

export default async function replyWithFavoritesInline(
	ctx: Context,
	inlineQuery: string,
	specifiedPage: number | undefined,
	user: User
): Promise<void> {
	const searchType: 'photo' | 'article' = config.show_favorites_as_gallery ? 'photo' : 'article'

	if (searchType === 'photo') {
		const results: InlineQueryResult[] = await getFavoritesUniversal(user, specifiedPage, inlineQuery)
		results.forEach((result)=>{
			result.type = 'photo'
		})
		try {
			await ctx.answerInlineQuery(results, {
				cache_time:  0,
				is_personal: true,
			})
		} catch (error){
			throw new Werror(error, 'Answer Inline Favorites Photo')
		}
	} else {
		const results: InlineQueryResult[] = await getFavoritesUniversal(user, specifiedPage, inlineQuery)
		results.forEach((result)=>{
			result.type = 'article'
		})
		try {
			await ctx.answerInlineQuery(results, {
				cache_time:  0,
				is_personal: true,
			})
		} catch (error){
			throw new Werror(error, 'Answer Inline Favorites Article')
		}
	}
}

async function getFavoritesUniversal(
	user: User,
	specifiedPage: number | undefined,
	inlineQuery: string
): Promise<InlineQueryResult[]> {
	const results: InlineQueryResult[] = []
	for (const favorite of user.favorites){
		const caption = getMangaMessage(favorite, favorite.telegraph_url)
		const description = sliceByHalf(favorite.title)
		const heart = config.like_button_true
		const InlineKeyboardMarkup: InlineKeyboardMarkup = {
			inline_keyboard: [
				[
					{
						text:          i18n.t('fix_button'),
						callback_data: 'fix_' + favorite._id,
					},
					{ text: 'Telegra.ph', url: String(favorite.telegraph_url) },
					{ text: heart, callback_data: 'like_' + favorite._id },
				]
			]
		}
		results.push({
			id:    favorite._id,
			type:  'photo',
			title: favorite.title
				.replace(/</g, '\\<')
				.replace(/>/g, '\\>')
				.trim(),
			description: description
				.replace(/</g, '\\<')
				.replace(/>/g, '\\>')
				.trim(),

			thumb_url: favorite.thumbnail,
			photo_url: favorite.thumbnail,

			input_message_content: {
				message_text: caption,
				parse_mode:   'HTML',
			},
			reply_markup: InlineKeyboardMarkup
		})
	}

	const pageNumber = specifiedPage || 1
	results.reverse()
	results.splice(0, 48 * (pageNumber - 1))

	if (results.length > 48) {
		const num_of_superfluous = results.length - 48
		results.splice(48, num_of_superfluous)
	}

	const nextPageSwitch = `/p${pageNumber + 1} ${inlineQuery}`

	results.unshift({
		id:          String(Math.floor(Math.random() * 10000000)),
		type:        'photo',
		title:       i18n.t('favorites'),
		description: i18n.t('favorites_tip_description'),

		photo_url: config.favorites_icon_inline,
		thumb_url: config.favorites_icon_inline,

		input_message_content: {
			message_text: i18n.t('tap_to_open_favorites'),
			parse_mode:   'HTML',
		},
		reply_markup: favoritesReplyMarkup,
	})

	if (pageNumber < Math.ceil(results.length / 48)) {
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
	}
	return results
}