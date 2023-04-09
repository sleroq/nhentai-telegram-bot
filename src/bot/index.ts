import { Bot, BotError } from 'grammy'
import getDoujin from '../lib/get-doujin.js'
import Werror from '../lib/error.js'
import {NotFoundError} from '../sources/index.js'
import {pino} from 'pino'

export default async function startBot(token: string, logger: pino.Logger) {
	const bot = new Bot(token)

	bot.catch((err: BotError) => { logger.error(err) })

	bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'))

	bot.command('id', async (ctx) => {
		const id = ctx.msg.text.split(' ')[1]?.trim()
		if (!id) return ctx.reply('Please provide an id')

		let doujin
		try {
			doujin = await getDoujin(id)
		} catch (err) {
			if (err instanceof Werror && err.cause instanceof NotFoundError) {
				return ctx.reply('Doujin not found')
			}
			void ctx.reply('Error getting doujin')
			throw new Werror(err, 'Error getting doujin')
		}

		return ctx.reply(doujin.description, {
			parse_mode: 'HTML',
		})
	})

	bot.on('message', (ctx) => ctx.reply('Got another message!'))

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
// 
// 	bot.on('text', async (ctx) => {
// 		try {
// 			await textHandler(ctx)
// 		} catch (error) {
// 			throw new Werror(error, 'Handling text')
// 		}
// 	})
// 
// 	return bot
// }
