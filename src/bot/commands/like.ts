import Werror from '../../lib/error'

import {
	CallbackQuery,
	InlineKeyboardButton
}                      from 'telegraf/typings/core/types/typegram'
import { User }  from '../../models/user.model'
import { Manga } from '../../models/manga.model'
import { Context }     from 'telegraf'

import config from '../../../config'
import i18n   from '../../lib/i18n'
import saveAndGetUser  from '../../db/save_and_get_user'
import saveAndGetManga from '../../db/save_and_get_manga'

export default async function likeDoujin (ctx: Context, query: CallbackQuery.DataCallbackQuery): Promise<void> {
	let user: User | undefined
	try {
		user = await saveAndGetUser(ctx)
	} catch (error) {
		throw new Werror(error, 'Getting user in callbackHandler')
	}

	const doujinId = Number(query.data.split('_')[1])
	if(!doujinId){
		throw new Werror('Somehow user is trying to like without id')
	}

	let doujin: Manga | undefined
	try {
		doujin = await saveAndGetManga(user, Number(doujinId))
	} catch (error) {
		if(error instanceof Error && error.message === 'Not found') {
			try {
				await ctx.reply(i18n.t('manga_does_not_exist') + '\n(' + doujinId + ')')
			} catch (error) {
				throw new Werror(error, 'Replying \'404\'')
			}
			return
		}
		throw new Werror(error, 'Getting manga by id')
	}
	let keyboard: InlineKeyboardButton[][]
	if (query.message
		&& ('reply_markup' in query.message)
		&& query.message.reply_markup) {
		keyboard = query.message.reply_markup.inline_keyboard
	} else {
		keyboard = [
			[
				{
					text: 'Telegra.ph',
					url:  String(doujin.telegraph_url)
				},
				{
					text:          config.like_button_false,
					callback_data: 'like_' + doujin.id
				},
			],
		]
	}

	if (!user.favorites.find(item => { return item._id === String(doujinId) })) {
		user.favorites.push({
			_id:           doujin.id,
			title:         doujin.title,
			description:   doujin.description,
			tags:          doujin.tags,
			pages:         doujin.pages,
			thumbnail:     String(doujin.thumbnail),
			telegraph_url: String(doujin.telegraph_url),
		})
		try {
			await user.save()
		} catch (error) {
			throw new Werror(error, 'Saving user to like doujin')
		}
		console.log('Added to favorites!')

		keyboard[0][keyboard[0].length - 1].text = config.like_button_true

		try {
			await ctx
				.answerCbQuery('Added to favorites!')
		} catch (error) {
			console.error(error, 'answerCbQuery')
		}
		try {
			await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard })
		} catch (error){
			throw new Werror(error, 'editing like button ')
		}
	} else {
		user.favorites.splice(user.favorites.indexOf(doujin.id), 1)
		try {
			await user.save()
		} catch (error) {
			throw new Werror(error, 'Saving user to like doujin')
		}
		console.log('Removed from favorites!')
		try {
			await ctx.answerCbQuery('Removed from favorites!')
		} catch (error) {
			console.error(error, 'answerCbQuery')
		}
		keyboard[0][keyboard[0].length - 1].text = config.like_button_false
		try {
			await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard })
		} catch (error){
			throw new Werror(error, 'editing like button ')
		}
	}
	console.log(user.favorites.length)
}
