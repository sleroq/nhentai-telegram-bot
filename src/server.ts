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
  if (process.env.REPL_URL || process.env.HEROKU_URL) {
    try {
      await startWithWebhook(bot, botToken)
    } catch (error) {
      throw new Verror(error, 'Starting bot with webhook')
    }
    console.log('Bot is started webhook!')
  } else {
    await bot.launch({ dropPendingUpdates: true })
    console.log('Bot is started polling!')
  }
})()