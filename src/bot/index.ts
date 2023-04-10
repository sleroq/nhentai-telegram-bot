import { Bot, BotError } from 'grammy'
import { pino } from 'pino'
import handleIDs from './cmds/by-ids.js'
import Werror from '../lib/error.js'
import search from './search.js'
import opener from './buttons/open.js'

export default async function startBot(token: string, logger: pino.Logger) {
	const bot = new Bot(token)

	bot.catch((err: BotError) => {
		logger.error(err)
	})

	bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'))

	bot.command('id', async (ctx) => {
		await ctx.reply('Just send me the id, no need to type /id command')

		const id = ctx.msg.text.split(' ')[1]?.trim()
		if (!id) return

		try {
			await handleIDs([id], ctx, logger)
		} catch (err) {
			throw new Werror(err, 'Error handling doujin id')
		}
	})

	bot.on('message', async (ctx) => {
		if (ctx.msg.via_bot?.id === bot.botInfo.id) return

		const ids = ctx.msg.text?.match(/\d+/gm)
		if (ids && ids.length) {
			if (ids.length > 20) {
				return ctx.reply('Please provide at most 20 ids')
			}

			try {
				await handleIDs(ids, ctx, logger)
			} catch (err) {
				throw new Werror(err, 'Error handling doujin ids')
			}
		}

		return
	})

	bot.use(search)
	bot.use(opener)

	void bot.start()
}

// import { Telegraf } from 'telegraf'
//
// import Werror from '../lib/error.ts'
//
// import saveAndGetUser from '../db/save_and_get_user'
// import i18n from '../lib/i18n'
//
// // Import all commands
// import callbackHandler from './callback_handler'
// import makeRandom from './commands/random'
// import textHandler from './text_handler'
// import inlineSearch from './inline_search/index'
// import help from './commands/help'
// import settings from './commands/settings/settings'
// import dlZip from './commands/dlzip'
//
// export default async function setupBot(token: string) {
// 	const bot = new Telegraf(token)
// 	bot.catch((error) => {
// 		console.error(error)
// 	})
//
// 	// commands that always work (without nhentai/telegraph connections)
// 	bot.start(async (ctx) => {
// 		await saveAndGetUser(ctx)
// 		const message = i18n.t('greeting', { name: ctx.from.first_name })
// 		try {
// 			await ctx.reply(message, {
// 				parse_mode: 'HTML',
// 				reply_markup: {
// 					inline_keyboard: [
// 						[{
// 							text: i18n.t('random_button'),
// 							callback_data: 'r'
// 						}],
// 					],
// 				},
// 			})
// 		} catch (error) {
// 			throw new Werror(error, 'Replying greetings')
// 		}
// 	})
//
// 	bot.help(async (ctx) => {
// 		try {
// 			await help(ctx)
// 		} catch (error) {
// 			throw new Werror(error, 'Handling \'/help\' command')
// 		}
// 	})
// 	bot.command('code', async (ctx) => {
// 		try {
// 			await ctx.reply(i18n.t('just_send_me_a_code'))
// 		} catch (error) {
// 			throw new Werror(error, 'Replying on \'/code\' command')
// 		}
// 	})
//
// 	bot.command('settings', async (ctx) => {
// 		try {
// 			await settings(ctx)
// 		} catch (error) {
// 			throw new Werror(error, 'Handling settings')
// 		}
// 	})
//
// 	bot.command('id', async (ctx) => {
// 		try {
// 			await ctx.reply('`' + ctx.from.id + '`', { parse_mode: 'Markdown' })
// 		} catch (error) {
// 			throw new Werror(error, 'Replying on \'/id\' command')
// 		}
// 	})
//
// 	// commands with nhentai
// 	bot.command('rand', async (ctx) => {
// 		try {
// 			await makeRandom(ctx, 'next')
// 		} catch (error) {
// 			throw new Werror(error, 'Handling \'/rand\' command')
// 		}
// 	})
//
// 	bot.command('zip', async (ctx) => {
// 		try {
// 			await dlZip(ctx)
// 		} catch (error) {
// 			throw new Werror(error, 'Handling \'/zip\' command')
// 		}
// 	})
//
// 	bot.on('callback_query', async (ctx) => {
// 		try {
// 			await callbackHandler(ctx, ctx.update.callback_query)
// 		} catch (error) {
// 			throw new Werror(error, 'Handling callback_query')
// 		}
// 	})
//
// 	bot.on('inline_query', async (ctx) => {
// 		try {
// 			await inlineSearch(ctx)
// 		} catch (error) {
// 			throw new Werror(error, 'Handling inline_query')
// 		}
// 	})
