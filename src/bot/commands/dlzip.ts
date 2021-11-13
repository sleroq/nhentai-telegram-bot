import Werror from '../../lib/error'

import i18n    from '../../lib/i18n'
import got, { Response } from 'got'
import AdmZip  from 'adm-zip'

import nhentai, { Doujin } from '../../lib/nhentai'
import { getMangaMessage } from '../../lib/some_functions'
import { Context, TelegramError }    from 'telegraf'

interface QueueItem { chatId: number | string, doujinId: number }
let queue: QueueItem[] = []

let currentlyWorking = false
export default async function dlZip(ctx: Context): Promise<void> {
	if (!ctx.message || !('text' in ctx.message) || !ctx.message.text){
		throw new Werror('No message text')
	}
	const message = ctx.message.text
	const matchId = message.match(/\d+/)
	const mangaId = matchId ? Number(matchId[0]) : null
	
	if (!mangaId || Number.isNaN(mangaId)) {
		try {
			await ctx.reply(i18n.t('zip_tip'), {
				parse_mode: 'Markdown',
			})
		} catch (error) {
			throw new Werror(error, 'Replying on /zip with no id')
		}

		return
	}

	queue.push({ chatId: ctx.message.chat.id, doujinId: mangaId })
	if (!currentlyWorking) {
		currentlyWorking = true
		processQueue()
	}

	async function processQueue() {
		try {
			for (const {doujinId, chatId} of queue) {
				let manga: Doujin | undefined
				try {
					manga = await nhentai.getDoujin(doujinId)
				} catch (error) {
					if (error instanceof Error && error.message === 'Not found') {
						try {
							await ctx.telegram.sendMessage(
								chatId,
								i18n.t('manga_does_not_exist') + ' (<code>' + doujinId + '</code>)',
								{ parse_mode: 'HTML' }
							)
						} catch (error) {
							logTelegramError(error, 'Replying \'404\'')
						}
					} else {
						try {
							await ctx.telegram.sendMessage(
								chatId,
								i18n.t('failed_to_get') + ' (<code>' + doujinId + '</code>)',
								{ parse_mode: 'HTML' }
							)
						} catch (error) {
							logTelegramError(error, 'Replying \'failed_to_get\'')
						}
					}
					console.log('removing')
					queue = removeFromQueue(queue, doujinId, chatId)
					continue
				}
				if (manga.details.pages > 150) {
					try {
						await ctx.telegram.sendMessage(chatId, i18n.t('too_many_pages'), {parse_mode: 'HTML'})
					} catch (error) {
						queue = removeFromQueue(queue, doujinId, chatId)
						logTelegramError(error, 'Replying /zip too many pages')
					}
					continue
				}

				const messageText = getMangaMessage(manga)

				const file = new AdmZip()

				// TODO implement async
				for (const page of manga.pages) {
					let response: Response<Buffer> | undefined
					try {
						await ctx.telegram.sendChatAction(chatId, 'upload_document')
					} catch (error) {
						logTelegramError(error, 'Making chat action "upload_document"')
					}
					try {
						response = await got(page, {responseType: 'buffer'})
					} catch (error) {
						logTelegramError(error, 'Downloading image ' + page)
						continue
					}
					file.addFile(manga.pages.indexOf(page) + '.jpg', response.body)
				}
				try {
					await ctx.telegram.sendDocument(
						chatId,
						{
							source:   file.toBuffer(),
							filename: mangaId + '.zip'
						},
						{
							caption:    messageText,
							parse_mode: 'HTML',
						}
					)
				} catch (error) {
					queue = removeFromQueue(queue, doujinId, chatId)
					if (error instanceof TelegramError && error.code === 413) {
						try {
							await ctx.telegram.sendMessage(chatId, i18n.t('file_is_too_big'))
						} catch (error) {
							logTelegramError(error, 'Replying with file_is_too_big')
						}
						console.error('Sending zip file ' + error.message)
						continue
					}
				}
				queue = removeFromQueue(queue, doujinId, chatId)
			}
		} catch (error) {
			console.error('Unexpected error processing queue:')
			console.error(error)
		}
		if (queue.length !== 0) {
			processQueue()
		} else {
			console.log('Finished work on /zip queue!')
			currentlyWorking = false
		}
	}
}

function removeFromQueue(queue: QueueItem[], doujinId: number, chatId: number | string){
	return queue.filter((item) => item.chatId !== chatId && item.doujinId !== doujinId)
}

function logTelegramError (error: unknown, message?: string) {
	if (error instanceof TelegramError) {
		console.error(`${message}: ${error.message}`)
	} else {
		console.error('error in not an instance of TelegramError')
	}
}