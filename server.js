const { Telegraf } = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.telegram.setWebhook("https://kipeeng-alive.herokuapp.com/secret-path");

const express = require("express");
const expressApp = express();
expressApp.use(bot.webhookCallback("/secret-path"));

const db = require("./db/dbhandler.js");

//modules

const { getbycode } = require('./bot/commands/getbycode.js')
const { randomCommand } = require('./bot/commands/random.js')

const { qb_query } = require('./bot/buttons/index.js')
const { inlineSearch } = require('./bot/inline_search.js')

//

bot.start(async (ctx) => {
    ctx.reply(
    "*This bot have R-18 content, click this button only if you mature enough*",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Random manga", callback_data: "r" }]]
      }
    }
  );
  await db.addUser(ctx.from)
})

bot.command('code', async (ctx)=>{ await getbycode(ctx) })
bot.command('rand', async (ctx)=>{ await randomCommand(ctx)})

bot.on("callback_query", async (ctx, next) => {
  await qb_query(ctx);
});
bot.on("inline_query", async ctx => {
  await inlineSearch(ctx);
});
const PORT = process.env.PORT || 3000;
expressApp.get("/", (req, res) => {
  res.send("Hello, love <3");
});
expressApp.listen(PORT, () => {
   console.log(`Our app is running on port ${ PORT }`);
});
