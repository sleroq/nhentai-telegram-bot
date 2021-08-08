import dotenv from 'dotenv'
dotenv.config()

import Verror from 'verror'
import { Telegraf } from 'telegraf'

import startWithWebhook from './express'

import saveAndGetUser from './db/save_and_get_user'
// Import all commands
import randomCommand from './bot/commands/random.js'
import dlzip from './bot/commands/dlzip.js'
import help from './bot/commands/help.js'
import settings from './bot/settings/settings.js'

import cb_query from './bot/buttons/index.js'
import inlineSearch from './bot/inline_search.js'
import textHandler from './bot/commands/textHandler.js'

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

//coonnect to the database
import mongoose from 'mongoose'

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () { console.log('mongoose is connected!') })

// commands that always work (without nhentai/telegraph connections)

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

bot.help(async (ctx) => {
  await help(ctx)
})
bot.command('code', async (ctx) => {
  try {
    await ctx.reply('Just send me a code')
  } catch (err) {
    return
  }
})
bot.command('settings', async (ctx) => { await settings(ctx) })
bot.command('id', async (ctx) => {
  try {
    await ctx.reply('`' + ctx.from.id + '`', { parse_mode: 'Markdown' })
  } catch (err) {
    return
  }
});

// // commands with nhentai
// bot.command("rand", async (ctx) => { await randomCommand(ctx); });
// bot.command("zip", async (ctx) => { await dlzip(ctx); });
// // non-text
// bot.on("callback_query", async (ctx) => { await cb_query(ctx); });
// bot.on("inline_query", async (ctx) => { await inlineSearch(ctx); });

// // get with id
// bot.on("text", async (ctx) => { await textHandler(ctx); });

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