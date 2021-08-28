import dotenv from 'dotenv'
dotenv.config()

import connectToMongo    from './db/connect'
import { createAccount } from './lib/telegraph'
import bot               from './bot/index'
import startWithWebhook  from './express'

import Verror from 'verror'

(async() => {
  // get telegra.ph token
  if (!process.env.TELEGRAPH_TOKEN) {
    process.env.TELEGRAPH_TOKEN = await createAccount()
  }

  // Connect to the mongo database
  await connectToMongo()

  // start the bot
  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    throw new Error('No BOT_TOKEN in env')
  }
  if (process.env.REPL_OWNER && process.env.REPL_SLUG || process.env.HEROKU_APP_NAME) {
    let webhookUrl: string | undefined
    if (process.env.HEROKU_APP_NAME) {
      webhookUrl = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com/`
    } else {
      webhookUrl = `https://replit.com/@${process.env.REPL_OWNER}/${process.env.REPL_SLUG}/`
    }
    try {
      await startWithWebhook(bot, webhookUrl)
    } catch (error) {
      throw new Verror(error, 'Starting bot with webhook')
    }
    console.log('Bot is started webhook!')
  } else {
    await bot.launch({ dropPendingUpdates: true })
    console.log('Bot is started polling!')
  }
})()