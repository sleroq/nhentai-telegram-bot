import i18n   from '../../lib/i18n'
import Werror from '../../lib/error'

import {
	assembleKeyboard,
	getMangaMessage,
} from '../../lib/some_functions'
import saveAndGetUser  from '../../db/save_and_get_user'
import saveAndGetManga from '../../db/save_and_get_manga'

import { Context }              from 'telegraf'
import { User }    from '../../models/user.model'
import { Manga }   from '../../models/manga.model'

export default async function openInTelegraph (ctx: Context, query: string): Promise<void> {
	let user: User | undefined
	try {
		user = await saveAndGetUser(ctx)
	} catch (error) {
		throw new Werror(error, 'Getting user in callbackHandler')
	}

	try {
		await ctx.editMessageReplyMarkup({
			inline_keyboard: [
				[
					{
						text:          i18n.t('waitabit_button'),
						callback_data: 'wait'
					}
				],
			],
		})
	} catch (error) {
		console.error('openInTelegraph: Edit buttons before starting: ' + error)
	}

	const mangaId = query.split('_')[1]
	let manga: Manga | undefined
	try {
		manga = await saveAndGetManga(user, Number(mangaId))
	} catch (error) {
		if(error instanceof Error && error.message === 'Not found') {
			try {
				await ctx.reply(i18n.t('manga_does_not_exist') + '\n(' + mangaId + ')')
			} catch (error) {
				throw new Werror(error, 'Replying \'404\'')
			}
			return
		}
		throw new Werror(error, 'Getting manga by id')
	}
	const telegraphUrl = manga.telegraph_fixed_url
		? manga.telegraph_fixed_url
		: manga.telegraph_url

	const inline_keyboard = assembleKeyboard(user, manga, telegraphUrl, true),
		messageText = getMangaMessage(manga, telegraphUrl)

	user.manga_history.push(manga.id) // save to history
	await user.save()

	try {
		await ctx.editMessageText(messageText, {
			parse_mode:   'HTML',
			reply_markup: {
				inline_keyboard: inline_keyboard,
			},
		})
	} catch (error){
		throw new Werror(error, 'Editing opened in telegraph')
	}
}
