import { Telegraf } from 'telegraf'

import Werror from '../lib/error'

import saveAndGetUser from '../db/save_and_get_user'
import i18n from '../lib/i18n'

// Import all commands
import callbackHandler from './callback_handler'
import makeRandom from './commands/random'
import textHandler from './text_handler'
import inlineSearch from './inline_search/index'
import help from './commands/help'
import settings from './commands/settings/settings'
import dlZip from './commands/dlzip'

export default async function setupBot(token: string) {
	const bot = new Telegraf(token)
	bot.catch((error) => {
		console.error(error)
	})

	// commands that always work (without nhentai/telegraph connections)
	bot.start(async (ctx) => {
		await saveAndGetUser(ctx)
		const message = i18n.t('greeting', { name: ctx.from.first_name })
		try {
			await ctx.reply(message, {
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: [
						[{
							text: i18n.t('random_button'),
							callback_data: 'r'
						}],
					],
				},
			})
		} catch (error) {
			throw new Werror(error, 'Replying greetings')
		}
	})

	bot.help(async (ctx) => {
		try {
			await help(ctx)
		} catch (error) {
			throw new Werror(error, 'Handling \'/help\' command')
		}
	})
	bot.command('code', async (ctx) => {
		try {
			await ctx.reply(i18n.t('just_send_me_a_code'))
		} catch (error) {
			throw new Werror(error, 'Replying on \'/code\' command')
		}
	})

	bot.command('settings', async (ctx) => {
		try {
			await settings(ctx)
		} catch (error) {
			throw new Werror(error, 'Handling settings')
		}
	})

	bot.command('id', async (ctx) => {
		try {
			await ctx.reply('`' + ctx.from.id + '`', { parse_mode: 'Markdown' })
		} catch (error) {
			throw new Werror(error, 'Replying on \'/id\' command')
		}
	})

	// commands with nhentai
	bot.command('rand', async (ctx) => {
		try {
			await makeRandom(ctx, 'next')
		} catch (error) {
			throw new Werror(error, 'Handling \'/rand\' command')
		}
	})

	bot.command('zip', async (ctx) => {
		try {
			await dlZip(ctx)
		} catch (error) {
			throw new Werror(error, 'Handling \'/zip\' command')
		}
	})

	bot.on('callback_query', async (ctx) => {
		if (!('data' in ctx.update.callback_query)
			|| !ctx.update.callback_query.data
			|| !ctx.from) {
			return
		}
		const callback_query = ctx.update.callback_query
		try {
			await callbackHandler(ctx, callback_query)
		} catch (error) {
			throw new Werror(error, 'Handling callback_query')
		}
	})

	bot.on('inline_query', async (ctx) => {
		try {
			await inlineSearch(ctx)
		} catch (error) {
			throw new Werror(error, 'Handling inline_query')
		}
	})

	bot.on('text', async (ctx) => {
		try {
			await textHandler(ctx)
		} catch (error) {
			throw new Werror(error, 'Handling text')
		}
	})

	return bot
}