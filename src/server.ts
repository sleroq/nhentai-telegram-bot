import dotenv from 'dotenv'
dotenv.config()

import connectToMongo    from './db/connect'
import { createAccount } from './lib/telegraph'
import setupBot          from './bot/index'
import startWithWebhook  from './express'

import Werror from './lib/error'

(async() => {
	// get telegra.ph token
	if (!process.env.TELEGRAPH_TOKEN) {
		process.env.TELEGRAPH_TOKEN = await createAccount()
	}
	if (!process.env.BOT_TOKEN) {
		throw new Error('No BOT_TOKEN in env')
	}
	if (!process.env.DATABASE_URL) {
		throw new Error('No DATABASE_URL in env')
	}
	
	// Connect to the mongo database
	await connectToMongo(process.env.DATABASE_URL, process.env.DATABASE2_URL)

	const bot = await setupBot(process.env.BOT_TOKEN)

	// Set webhook if url is provided
	if (process.env.REPL_OWNER && process.env.REPL_SLUG || process.env.HEROKU_APP_NAME) {
		let webhookUrl: string | undefined
		if (process.env.HEROKU_APP_NAME) {
			webhookUrl = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`
		} else {
			webhookUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER?.toLowerCase()}.repl.co`
		}
		try {
			await startWithWebhook(bot, webhookUrl)
		} catch (error) {
			throw new Werror(error, 'Starting bot with webhook')
		}
		console.log('Bot is started webhook!')
	} else {
		await bot.launch({ dropPendingUpdates: true })
		console.log('Bot is started polling!')
	}
})()