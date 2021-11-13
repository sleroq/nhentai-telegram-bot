import Werror from '../../../lib/error'

import { Context } from 'telegraf'
import { CallbackQuery, InlineKeyboardButton, Update } from 'telegraf/typings/core/types/typegram'

import { User } from '../../../models/user.model'
import saveAndGetUser from '../../../db/save_and_get_user'

import settings from './settings'
import { toggle_safe_mode } from './safe_mode'
import i18n from '../../../lib/i18n'
import config from '../../../../config'

async function safeAndEdit(user: User, ctx: Context) {
	try {
		await user.save()
	} catch (error) {
		throw new Werror(error, 'Saving user after changing setting')
	}
	try {
		await settings(ctx)
	} catch (error) {
		throw new Werror(error, 'Editing message after changing settings')
	}
}
export default async function settingsChanger(ctx: Context<Update>, callback_query: CallbackQuery.DataCallbackQuery): Promise<void> {
	let user: User | undefined
	try {
		user = await saveAndGetUser(ctx)
	} catch (error) {
		throw new Werror(error, 'Getting user in settings')
	}
	const data = callback_query.data
	const setting = data.split('_')[1]
	switch (setting) {
	case 'search-type': {
		user.search_type = user.search_type == 'article' ? 'photo' : 'article'
		await safeAndEdit(user, ctx)
		break
	}
	case 'search-sorting': {
		user.search_sorting = user.search_sorting == 'date' ? 'popular' : 'date'
		await safeAndEdit(user, ctx)
		break
	}
	case 'random-locally': {
		user.random_localy = !user.random_localy
		await safeAndEdit(user, ctx)
		break
	}
	case 'repeat-in-random': {
		user.can_repeat_in_random = !user.can_repeat_in_random
		await safeAndEdit(user, ctx)
		break
	}
	case 'safe-mode': {
		try {
			await toggle_safe_mode(user)
		} catch (error) {
			throw new Werror(error, 'Toggling safe mode')
		}
		await safeAndEdit(user, ctx)
		break
	}
	case 'language': {
		await editLanguages(user, ctx)
		break
	}
	case 'set-language': {
		const lang = data.split('_')[2]
		if (user.language_code === lang) {
			return
		}
		user.language_code = lang
		try {
			await user.save()
		} catch (error) {
			throw new Werror(error, 'Saving user after editing language')
		}
		try {
			await i18n.changeLanguage(lang)
		} catch (error) {
			throw new Werror(error, 'setting language for i18n, language: \'' + lang + '\'')
		}
		await editLanguages(user, ctx)
		break
	}
	case 'back-main': {
		await safeAndEdit(user, ctx)
		break
	}
	default: {
		throw new Error('no such setting: ' + setting)
	}
	}
}

async function editLanguages(user: User, ctx: Context) {
	const supported = ['en', 'ru', 'es'] // TODO: get languages from i18n
	const inlineKeyboard: InlineKeyboardButton[][] = []
	let checkExists = false

	supported.forEach((language) => {
		let buttonText = i18n.t('language_name', { lng: language })
		if (language === user.language_code) {
			buttonText += ' ' + config.check_mark
			checkExists = true
		}
		inlineKeyboard.push([
			{
				text:          buttonText,
				callback_data: 'sttgs_set-language_' + language,
			},
		])
	})
	inlineKeyboard.push([
		{
			text:          i18n.t('back_button'),
			callback_data: 'sttgs_back-main',
		},
	])
	if (!checkExists){
		const englishIndex = inlineKeyboard.findIndex(element => element[0].text === 'English')
		inlineKeyboard[englishIndex][0].text = 'English' + config.check_mark
	}
	try {
		await ctx.editMessageText(i18n.t('choose_a_language'), {
			parse_mode:   'HTML',
			reply_markup: {
				inline_keyboard: inlineKeyboard,
			},
		})
	} catch (error) {
		throw new Werror(error, 'Editing message with languages')
	}
}
