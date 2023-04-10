import { Bot, BotError } from 'grammy'
import { pino } from 'pino'
import handleIDs from './cmds/by-ids.js'
import Werror from '../lib/error.js'
import search from './search.js'
import opener from './buttons/open.js'
import rand from './cmds/rand.js'

export default async function startBot(token: string, logger: pino.Logger) {
	const bot = new Bot(token)

	bot.catch((err: BotError) => {
		logger.error(err)
	})

	bot.command('start', ctx => {
		let message = 'Welcome!\n'
		message += '/rand - random doijin\n'
		message += '<code>123123</code> - doujin by id\n\n'
		message += '<a href="https://github.com/sleroq/nhentai-telegram-bot">GitHub</a> - help with development\n'

		return ctx.reply(message, {
			parse_mode: 'HTML',
			disable_web_page_preview: true,
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Search',
							switch_inline_query_current_chat: '',
						}
					],
				],
			}
		})
	})

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

	bot.use(search)
	bot.use(opener)
	bot.use(rand)

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

// 	bot.help(async (ctx) => {
// 		try {
// 			await help(ctx)
// 		} catch (error) {
// 			throw new Werror(error, 'Handling \'/help\' command')
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
// 	bot.command('zip', async (ctx) => {
// 		try {
// 			await dlZip(ctx)
// 		} catch (error) {
// 			throw new Werror(error, 'Handling \'/zip\' command')
// 		}
// 	})