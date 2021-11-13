import Werror from '../../lib/error'
import i18n from '../../lib/i18n'

import {
	assembleKeyboard,
	getMangaMessage,
} 					   from '../../lib/some_functions'
import saveAndGetManga from '../../db/save_and_get_manga'

import { Context }                from 'telegraf'
import { User }                   from '../../models/user.model'
import { Manga }                  from '../../models/manga.model'
import MessageRecord, { Message } from '../../models/message.model'

import saveAndGetUser from '../../db/save_and_get_user'

export default async function makeRandom(ctx: Context, mode: 'next' | 'previous'): Promise<void> {
	let user: User | undefined
	try {
		user = await saveAndGetUser(ctx)
	} catch (error) {
		throw new Werror(error, 'Getting user in callbackHandler')
	}

	let message: Message | null = null

	if (('callback_query' in ctx.update)
		&& ctx.update.callback_query.message
		&& ctx.update.callback_query.message.from){
		const chat_id = String(ctx.update.callback_query.message.chat.id)
		const message_id = ctx.update.callback_query.message.message_id
		try {
			message = await MessageRecord.findOne({
				message_id,
				chat_id,
			})
		} catch (error) {
			console.error('Can\'t get a message')
			console.error(error)
		}
		if(!message){
			message = await createMessage(chat_id, String(message_id))
		}
	} else if (ctx.message) {
		message = await createMessage(String(ctx.message.chat.id), String(ctx.message.message_id + 1))
	} else {
		throw new Werror('Can\'t get message_id and chat_id from context')
	}
	let manga: Manga | undefined

	// console.log('current: ' + message.current)
	// console.log('history length: ' + (message.history.length - 1))

	if (mode === 'previous') {
		if (message.current === 0) {
			return
		}
		try {
			manga = await saveAndGetManga(user, message.history[message.current-1])
		} catch (error) {
			throw new Werror(error, 'Getting random manga')
		}
		message.current -= 1
	} else
	/* if user at the and of history
		 [ 234, 123, 345, 1243, 356]  - history.length === 5
														usr     current        === 4 */
	// TODO: be able to work without database connection
	if (message.current >= (message.history.length - 1)){
		try {
			manga = await saveAndGetManga(user)
		} catch (error) {
			throw new Werror(error, 'Getting random manga')
		}
		message.history.push(manga.id)
		if (message.history.length > 50) {
			// (i have only 500mb bro stop)
			for (let t = message.history.length; t > 50; t--) {
				message.history.shift()
			}
		} else {
			if (message.history.length !== 1){
				message.current += 1
			}
		}
	} else
	/* if user previously was clicking back button and he is not at the end of history
		 [ 234, 123, 345, 1243, 356]  - history.length === 5
						usr                     current        === 1                             */
	{
		message.current += 1
		try {
			manga = await saveAndGetManga(user, message.history[message.current])
		} catch (error) {
			throw new Werror(error, 'Getting random manga')
		}
	}
	user.manga_history.push(manga.id)
	if (user.manga_history.length > 50) {
		// you don't need so much history, do you?
		for (let t = user.manga_history.length; t > 50; t--) {
			user.manga_history.shift()
		}
	}
	try {
		await message.save()
	} catch (error) {
		throw new Werror(error, 'Saving message')
	}
	try {
		await user.save()
	} catch (error) {
		throw new Werror(error, 'Saving user')
	}

	const telegraphUrl = manga.telegraph_fixed_url
		? manga.telegraph_fixed_url
		: manga.telegraph_url
	const messageText = getMangaMessage(manga, telegraphUrl)
	const inlineKeyboard = assembleKeyboard(user, manga, telegraphUrl)

	if (message.current > 0) {
		inlineKeyboard[2].unshift({
			text:          i18n.t('previous_button'),
			callback_data: 'previous',
		})
	}

	// finally!
	if ('callback_query' in ctx.update) {
		try {
			await ctx.editMessageText(messageText, {
				parse_mode:   'HTML',
				reply_markup: {
					inline_keyboard: inlineKeyboard,
				},
			})
		} catch (error) {
			throw new Werror(error, 'Editing random manga (->)')
		}
	} else {
		try {
			await ctx.reply(messageText, {
				parse_mode:   'HTML',
				reply_markup: {
					inline_keyboard: inlineKeyboard,
				},
			})
		} catch (error) {
			throw new Werror(error, 'Replying with random manga (->)')
		}
	}
}

async function createMessage(chat_id: string, message_id: string){
	return new MessageRecord({
		chat_id:    chat_id,
		message_id: message_id,
		current:    0,
		history:    [],
	})
}