import Werror from '../../lib/error'

import Context from 'telegraf/typings/context'
import config  from '../../../config'
import i18n    from '../../lib/i18n'

import { assembleKeyboard, getMangaMessage, sliceByHalf } from '../../lib/some_functions'

import { InlineQueryResult } from 'typegram'
import { User }              from '../../models/user.model'
import { Manga }             from '../../models/manga.model'
import saveAndGetManga       from '../../db/save_and_get_manga'

const nothingIsFoundResult: InlineQueryResult = {
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
					text: i18n.t('search_tips_button'),
					callback_data: 'searchtips',
				},
			],
			[{ text: i18n.t('settings_button'), callback_data: 'settings' }],
		],
	},
}

export default async function replyByIdInline(
	ctx: Context,
	inlineQuery: string,
	user: User,
	doujinId: number,
): Promise<void> {
	let doujin: Manga | undefined
	try {
		doujin = await saveAndGetManga(user, doujinId)
	} catch (error) {
		// if nothing is found
		if(error instanceof Error && error.message === 'Not found') {
			const results: InlineQueryResult[] = []
			results.push(nothingIsFoundResult)
			try {
				await ctx.answerInlineQuery(results).catch((err) => console.log(err))
			} catch (error) {
				throw new Werror(error, 'Answer Inline Nothing is found')
			}
			return
		}
		throw new Werror(error, 'Getting doujin by id inline ' + doujinId)
	}
	
	const searchType: 'photo' | 'article' = config.show_favorites_as_gallery ? 'photo' : 'article'

	if (searchType === 'photo') {
		const results: InlineQueryResult[] = await getDoujinUniversal(doujin, user)
		results.forEach((result)=>{
			result.type = 'photo'
		})
		try {
			await ctx.answerInlineQuery(results, {
				cache_time:  0,
				is_personal: true,
			})
		} catch (error){
			throw new Werror(error, 'Answer Inline Search by id Photo')
		}
	} else {
		const results: InlineQueryResult[] = await getDoujinUniversal(doujin, user)
		results.forEach((result)=>{
			result.type = 'article'
		})
		try {
			await ctx.answerInlineQuery(results, {
				cache_time:  0,
				is_personal: true,
			})
		} catch (error){
			throw new Werror(error, 'Answer Inline Search by id Article')
		}
	}

}

async function getDoujinUniversal (
	doujin: Manga,
	user: User
): Promise<InlineQueryResult[]> {
	const results: InlineQueryResult[] = []

	const telegraph_url = doujin.telegraph_fixed_url
		? doujin.telegraph_fixed_url
		: doujin.telegraph_url

	const messageText = getMangaMessage(doujin, telegraph_url)
	const inline_keyboard = assembleKeyboard(user, doujin, telegraph_url, true)
	const description = doujin.description || sliceByHalf(doujin.title)
	results.push({
		id:    String(doujin.id),
		type:  'photo',
		title: doujin.title
			.replace(/</g, '\\<')
			.replace(/>/g, '\\>')
			.trim(),
		description: description
			.replace(/</g, '\\<')
			.replace(/>/g, '\\>')
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