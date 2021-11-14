import Context from 'telegraf/typings/context'
import config  from '../../../config'
import i18n    from '../../lib/i18n'
import Manga   from '../../models/manga.model.js'

import { getMangaMessage, isFullColor, sliceByHalf } from '../../lib/some_functions'

import { User } from '../../models/user.model'
import { InlineQueryResult } from 'typegram/inline'
import Werror from '../../lib/error'

const history_reply_markup = {
	inline_keyboard: [
		[
			{
				text: i18n.t('history_tip_title'),
				switch_inline_query_current_chat: '/h',
			},
		],
	],
}
export default async function replyWithHistoryInline(
	ctx: Context,
	user: User
): Promise<void> {
	const searchType: 'article' | 'photo' = config.show_history_as_gallery ? 'photo' : 'article'
	if (searchType === 'photo') {
		const results: InlineQueryResult[] = await getHistoryUniversal(user)
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
		const results: InlineQueryResult[] = await getHistoryUniversal(user)
		results.forEach((result)=>{
			result.type = 'article'
		})
		try {
			await ctx.answerInlineQuery(results, {
				cache_time:  0,
				is_personal: true,
			})
		} catch (error) {
			throw new Werror(error, 'Answer Inline Favorites Article')
		}
	}
}

async function getHistoryUniversal(
	user: User
): Promise<InlineQueryResult[]> {
	const results: InlineQueryResult[] = []
	if (!Array.isArray(user.manga_history) || user.manga_history.length === 0) {
		// history is empty
		results.push({
			id:                    String(69696969696969),
			type:                  'article',
			title:                 i18n.t('history_tip_title'),
			description:           i18n.t('history_is_empty'),
			thumb_url:             config.history_icon_inline,
			input_message_content: {
				message_text: i18n.t('tap_to_open_history'),
				parse_mode:   'HTML',
			},
			reply_markup: history_reply_markup,
		})
		return results
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
				text:          i18n.t('fix_button'),
				callback_data: 'fix_' + doujin.id,
			})
		}
		results.push({
			id:    doujin._id,
			type:  'article',
			title: doujin.title
				.replace(/</g, '\\<')
				.replace(/>/g, '\\>')
				.trim(),
			description: description
				.replace(/</g, '\\<')
				.replace(/>/g, '\\>')
				.trim(),
			thumb_url: doujin.thumbnail,
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
		type:                  'article',
		title:                 i18n.t('history_tip_title'),
		description:           i18n.t('history_tip_description'),
		thumb_url:             config.history_icon_inline,
		input_message_content: {
			message_text: i18n.t('tap_to_open_history'),
			parse_mode:   'HTML',
		},
		reply_markup: history_reply_markup,
	})
	results.reverse()
	return results
}
	