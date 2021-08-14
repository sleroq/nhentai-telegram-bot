import dotenv from 'dotenv'
dotenv.config()

import { Telegraf } from 'telegraf'
import Verror       from 'verror'

import startWithWebhook from './express'
import saveAndGetUser   from './db/save_and_get_user'
import i18n             from './lib/i18n'

// Import all commands
import callbackHandler from './bot/callback_handler'
import makeRandom      from './bot/commands/random'
import textHandler     from './bot/text_handler'
import inlineSearch    from './bot/inline_search/index'
import connectToMongo  from './db/connect'

const token = process.env.BOT_TOKEN
if (!token) {
  throw new Verror('No BOT_TOKEN in .env')
}

await connectToMongo()
const bot = new Telegraf(token)

// Connect to the database



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
    console.error('Random text command: ', error)
  }
})
// bot.command("zip", async (ctx) => { await dlzip(ctx); });


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

bot.on('text', async (ctx) => {
  try {
    await textHandler(ctx)
  } catch (error) {
    console.error('textHandler: ', error)
  }
})

// start the bot
if (process.env.REPL_URL || process.env.HEROKU_URL) {
  try {
    await startWithWebhook(bot, token)
  } catch (error) {
    throw new Verror(error, 'Starting bot with webhook')
  }
  console.log('Bot is started webhook!')
} else {
  await bot.launch({ dropPendingUpdates: true })
  console.log('Bot is started polling!')
}