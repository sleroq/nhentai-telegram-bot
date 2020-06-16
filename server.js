require("dotenv").config();
const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
let webhook = true;
if (process.env.ON_HEROKU) {
  bot.telegram.setWebhook(process.env.HEROKU_URL);
} else if (process.env.ON_GLITCH) {
  console.log(process.env.GLITCH_URL)
  bot.telegram.setWebhook(process.env.GLITCH_URL);
} else {
  webhook = false;
}
const express = require("express");
const expressApp = express();
if (webhook) {
  expressApp.use(bot.webhookCallback("/secret-path"));
}

const db = require("./db/dbhandler.js");

//modules
const { randomCommand } = require("./bot/commands/random.js");
const { dlzip } = require("./bot/commands/dlzip.js");
const { help } = require("./bot/commands/help.js");

const { qb_query } = require("./bot/buttons/index.js");
const { inlineSearch } = require("./bot/inline_search.js");
const { textHandler } = require("./bot/commands/textHandler.js");

// bot.start(async ctx => {
//   ctx.reply(
//     "*This bot have R-18 content, click this button only if you mature enough*",
//     {
//       parse_mode: "Markdown",
//       reply_markup: {
//         inline_keyboard: [[{ text: "Random manga", callback_data: "r" }]]
//       }
//     }
//   );
//   await db.addUser(ctx.from);
// });
// bot.help(async ctx => {
//   await help(ctx);
// });
// bot.command("code", async ctx => {
//   await ctx.reply("Just send me a code");
// });
// bot.command("rand", async ctx => {
//   await randomCommand(ctx);
// });
// bot.command("zip", async ctx => {
//   await dlzip(ctx);
// });
// bot.command("id", async ctx => {
//   await ctx.reply("`" + ctx.from.id + "`");
// });

// bot.on("callback_query", async (ctx, next) => {
//   await qb_query(ctx);
// });
// bot.on("inline_query", async ctx => {
//   await inlineSearch(ctx);
// });
// bot.on("text", async (ctx, next) => {
//   await textHandler(ctx);
// });
if (webhook) {
  const PORT = process.env.PORT || 3000;
  expressApp.get("/", (req, res) => {
    res.send("Hello, love <3");
  });
  expressApp.listen(PORT, () => {
    console.log(`Our app is running on port ${PORT}`);
  });
} else {
  bot.telegram.deleteWebhook().then(() => {
    bot.launch();
  });
}
