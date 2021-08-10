import dotenv from 'dotenv'
dotenv.config()

import Verror from 'verror'
import { Telegraf } from 'telegraf'

import startWithWebhook from './express'

import saveAndGetUser from './db/save_and_get_user'
import i18n from './i18n'
// Import all commands
// import dlzip from './bot/commands/dlzip.js'
// import help from './bot/commands/help.js'
// import settings from './bot/settings/settings.js'

import callbackHandler from './bot/callback_handler'
import makeRandom from './bot/commands/random'
import textHandler from './bot/text_handler'
import inlineSearch from './bot/inline_search/index'

let token: string | undefined
if (!process.env.BOT_TOKEN) {
  throw new Verror('No BOT_TOKEN in .env')
} else {
  token = process.env.BOT_TOKEN
}
if (!process.env.DATABASE_URL) {
  throw new Verror('No DATABASE_URL in env')
}

const bot = new Telegraf(process.env.BOT_TOKEN)

// Connect to the database
import mongoose from 'mongoose'

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () { console.log('mongoose is connected!') })

// Commands that always work (without nhentai/telegraph connections)

bot.start(async (ctx) => {
  await saveAndGetUser(ctx)
  const message = i18n.__('greeting')
  try {
    ctx.reply(message, {
      parse_mode:   'HTML',
      reply_markup: {
        inline_keyboard: [
          [{
            text:          i18n.__('random_button'),
            callback_data: 'r'
          }],
        ],
      },
    })
  } catch (err) {
    console.log(err)
  }
})

// bot.help(async (ctx) => {
//   await help(ctx)
// })
bot.command('code', async (ctx) => {
  try {
    await ctx.reply('Just send me a code')
  } catch (err) {
    return
  }
})
// bot.command('settings', async (ctx) => { await settings(ctx) })
bot.command('id', async (ctx) => {
  try {
    await ctx.reply('`' + ctx.from.id + '`', { parse_mode: 'Markdown' })
  } catch (err) {
    return
  }
})

// // commands with nhentai
bot.command('rand', async (ctx) => {
  try {
    await makeRandom(ctx, 'next')
  } catch (error) {
    console.error('Random text command: ' + error)
  }
})
// bot.command("zip", async (ctx) => { await dlzip(ctx); });

// non-text
bot.on('callback_query', async (ctx) => {
  if (!('data' in ctx.update.callback_query)
    || !ctx.update.callback_query.data
    || !ctx.from) {
    return
  }
  const query = ctx.update.callback_query.data
  try {
    await callbackHandler(ctx, query)
  } catch (error) {
    console.error('Callback query: ', error)
  }
})

bot.on('inline_query', async (ctx) => {
  try { 
    await inlineSearch(ctx) 
  } catch (error) {
    console.error('Inline search: ', error)
  } 
})

// get with id
bot.on('text', async (ctx) => {
  try {
    await textHandler(ctx)
  } catch (error) {
    console.error('textHandler: ' + error)
  }
});

// start the bot 
(async()=>{
  if (process.env.REPL_URL || process.env.HEROKU_URL) {
    await startWithWebhook(bot, token)
    console.log('Bot is started webhook!')
  } else {
    await bot.launch({ dropPendingUpdates: true })
    console.log('Bot is started polling!')
  }
})()