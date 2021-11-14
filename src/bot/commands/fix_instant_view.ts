import Werror from '../../lib/error'

import nhentai, { Doujin } from '../../lib/nhentai'

import { uploadByUrl, uploadResult }         from 'telegraph-uploader'
import { telegraphCreatePage }               from '../../lib/telegraph'
import { assembleKeyboard, getMangaMessage } from '../../lib/some_functions'

import { Manga } from '../../models/manga.model'
import MessageRecord, { Message } from '../../models/message.model'

import saveAndGetUser  from '../../db/save_and_get_user'
import saveAndGetManga from '../../db/save_and_get_manga'

import i18n from '../../lib/i18n'

import { Context } from 'telegraf'
import { CallbackQuery, InlineKeyboardButton } from 'telegraf/typings/core/types/typegram'

export default async function fixInstantViewAsync(
	ctx: Context,
	callback_query: CallbackQuery.DataCallbackQuery
): Promise<void> {
	try {
		await fixInstantView(ctx, callback_query)
	} catch (error) {
		console.error(error)
	}
}

async function fixInstantView(
	ctx: Context,
	callback_query: CallbackQuery.DataCallbackQuery
): Promise<void> {
	// Get doujin's id
	const matchId = callback_query.data.match(/_([0-9]+)/)
	if (!matchId || !Number(matchId[1])) {
		return
	}
	const doujinId = Number(matchId[1])

	// Get user
	let user
	try {
		user = await saveAndGetUser(ctx)
	} catch (error) {
		throw new Werror(error, 'Getting user in callbackHandler')
	}

	let doujin
	try {
		doujin = await saveAndGetManga(user, doujinId)
	} catch (error) {
		if (error instanceof Error && error.message === 'Not found') {
			try {
				await ctx.reply(`${i18n.t('manga_does_not_exist')}\n(${doujinId})`)
			} catch (error) {
				console.error('Replying \'404\'' + error)
			}
			return
		}
		throw new Werror(error, 'Can`t get doujin')
	}

	let message
	if (callback_query.message) {
		try {
			message = await MessageRecord.findOne({
				message_id: callback_query.message.message_id,
				chat_id: String(callback_query.message.from?.id),
			})
		} catch (error) {
			throw new Werror(error, 'Getting message')
		}

	}

	const fixingKeyboardBack = await buildKeyboardBack(doujin.telegraph_url, doujin.id, callback_query, message)
	
	const fixing_keyboard: InlineKeyboardButton[][] = [[]]
	const telegraph_url = doujin.telegraph_url
	// while manga is fixing you can still try to open broken one:
	if (telegraph_url) {
		fixing_keyboard[0].push({
			text: 'Telegra.ph',
			url: String(doujin.telegraph_url),
		})
	}
	fixing_keyboard[0].unshift({
		text: i18n.t('waitabit_button'),
		callback_data: 'wait',
	})
	try {
		await ctx.editMessageReplyMarkup({
			inline_keyboard: fixing_keyboard,
		})
	} catch (error) {
		throw new Werror(error, 'editMessageReplyMarkup before fixing pages: ')
	}

	let fixedUrl = doujin.telegraph_fixed_url

	if (!fixedUrl) {
		// getting urls for images
		let pages
		try {
			pages = await getPages(doujin.id)
		} catch (error) {
			if (error instanceof Error && error.message === 'Not found') {
				try {
					await ctx.reply(i18n.t('cant_get_anymore'))
				} catch (e) {
					throw new Werror(error, 'Replying \'404\'')
				}
			}
			throw new Werror(error, 'Getting pages to fix doujin')
		}

		// uploading each image to telegra.ph
		let attemptsCnt = 0    // count retries
		let uploadedUrls: string[] = []
		let notUploadedUrls = pages

		// in case it isn't the first try to fix this doujin we can restore saved pages
		if (Array.isArray(doujin.fixed_pages) && doujin.fixed_pages.length) {
			uploadedUrls = uniq(doujin.fixed_pages) // so get them from db
			notUploadedUrls = notUploadedUrls.slice(uploadedUrls.length - 1) // slicing already uploaded

			console.log(
				'restored ' + uploadedUrls.length + ' pages from previous try'
			)
		}

		let current = pages.indexOf(notUploadedUrls[0])
		const total = pages.length
		while (notUploadedUrls.length > 0) {
			// in case we were retrying after err 3 times - stop it
			if (attemptsCnt > 2) {
				try {
					await ctx.editMessageReplyMarkup({
						inline_keyboard: fixingKeyboardBack,
					})
				} catch (error) {
					console.error('editMessageReplyMarkup while fixing pages stopped trying: ', error)
				}
				return
			}

			try {
				await fixPage(ctx, notUploadedUrls[0], doujin, current, total)
			} catch (error) {
				console.error('fixing page: ' + notUploadedUrls[0], error)
				attemptsCnt++
				await sleep(5000) // maybe will help
				continue
			}
			notUploadedUrls.splice(0, 1)
			current++
		}

		try {
			fixedUrl = (await telegraphCreatePage(doujin, doujin.fixed_pages)).url
		} catch (error) {
			try {
				await ctx.editMessageReplyMarkup({
					inline_keyboard: fixingKeyboardBack,
				})
			} catch (error) {
				console.error('editMessageReplyMarkup with tryagain message: ', error)
			}
			throw new Werror(error, 'Creating fixed telegraph page')
		}

		// save new urle:
		doujin.telegraph_fixed_url = fixedUrl
		// delete all fixed pages from manga record
		doujin.fixed_pages = []
		try {
			await doujin.save()
		} catch (error) {
			console.error('saving fixed doujin: ', error)
		}
	}
	const inline_keyboard = assembleKeyboard(user, doujin, fixedUrl)
	const messageText = getMangaMessage(doujin, fixedUrl)

	if (message && message.current > 0) {
		inline_keyboard[2].unshift({
			text: i18n.t('previous_button'),
			callback_data: 'previous',
		})
	}

	console.log(`Fixed ${doujin.id}\nNew url = ${fixedUrl}\nOld url: = ${doujin.telegraph_url}`)

	try {
		await ctx.editMessageText(messageText, {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: inline_keyboard,
			},
		})
	} catch (error) {
		throw new Werror(error, 'Editing manga message after fix')
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function uniq(a: string[]) {
	const seen: Record<string, boolean> = {}
	return a.filter(function (item) {
		return Object.prototype.hasOwnProperty.call(seen, item) ? false : (seen[item] = true)
	})
}

async function getPages(id: number | string): Promise<string[]> {
	let doujinWithPages: Doujin
	try {
		doujinWithPages = await nhentai.getDoujin(id)
	} catch (error) {
		if (error instanceof Error && error.message === 'Not found') {
			throw new Error('Not found')
		}
		throw new Werror(error, 'Getting doujin to fix pages')
	}
	return doujinWithPages.pages
}

async function buildKeyboardBack(
	telegraph_url: string | undefined,
	id: string,
	callback_query: CallbackQuery.DataCallbackQuery,
	message: Message | undefined | null
): Promise<InlineKeyboardButton[][]> {
	const fixing_keyboard: InlineKeyboardButton[][] = [[]]

	// while manga is fixing you can still try to open broken one:
	if (telegraph_url) {
		fixing_keyboard[0].push({
			text: 'Telegra.ph',
			url: telegraph_url,
		})
	}
	fixing_keyboard[0].unshift({
		// button to try again:
		text: i18n.t('try_again_later'),
		callback_data: `fixLater_${id}_${new Date().getMinutes()}`,
	})
	// in case it happen not in inline search we should add buttons back:
	if (callback_query.message) {
		fixing_keyboard.push([
			{
				text: i18n.t('search_button'),
				switch_inline_query_current_chat: '',
			},
		])
		fixing_keyboard.push([
			{
				text: i18n.t('next_button'),
				callback_data: 'r',
			},
		])
		if (message && message.current > 0) {
			fixing_keyboard[2].unshift({
				text: i18n.t('previous_button'),
				callback_data: 'previous',
			})
		}
	}
	return fixing_keyboard
}

async function fixPage(
	ctx: Context,
	page: string,
	doujin: Manga,
	current: number,
	total: number
): Promise<void> {
	const fixing_keyboard: InlineKeyboardButton[][] = [[]]
	const telegraph_url = doujin.telegraph_url
	// while manga is fixing you can still try to open broken one:
	if (telegraph_url) {
		fixing_keyboard[0].push({
			text: 'Telegra.ph',
			url: String(doujin.telegraph_url),
		})
	}
	let newUrl: uploadResult | undefined
	try {
		newUrl = await uploadByUrl(page)
	} catch (error) {
		throw new Werror(error, 'error in uploading image happened')
	}

	if (newUrl && newUrl.link) {
		doujin.fixed_pages.push(newUrl.link) // if err, we won't lose pages
		await doujin.save() // hope there is no limits on the number of requests
	}

	// display the progress:
	fixing_keyboard[0].unshift({
		text: `${current + 1}/${total} ${i18n.t('pages_fixed')}`,
		callback_data: 'fixing',
	})
	try {
		await ctx.editMessageReplyMarkup({
			inline_keyboard: fixing_keyboard,
		})
	} catch (error) {
		throw new Werror(error, 'editMessageReplyMarkup while fixing pages')
	}
}