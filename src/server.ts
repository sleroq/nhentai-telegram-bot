import dotenv from 'dotenv';
dotenv.config();

import Verror from 'verror';
import { Context, Telegraf } from "telegraf";
import path from "path";

import { I18n } from "i18n";
const i18n = new I18n();
i18n.configure({
    locales: ['en', 'de'],
    defaultLocale: 'en',
    directory: path.join(__dirname, 'locales')
})

if (!process.env.BOT_TOKEN) {
    throw new Verror('No BOT_TOKEN in .env')
}
if (!process.env.DATABASE_URL) {
    throw new Verror('No DATABASE_URL in env')
}

const bot = new Telegraf(process.env.BOT_TOKEN);

//coonnect to the database
import mongoose from "mongoose";
import { Update } from 'typegram';
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () { console.log("mongoose is connected!"); });

const { saveAndGetUser } = require("./db/saveAndGetUser");
// import all commands
const { randomCommand } = require("./bot/commands/random.js");
const { dlzip } = require("./bot/commands/dlzip.js");
const { help } = require("./bot/commands/help.js");
const { settings } = require("./bot/settings/settings.js");

const { cb_query } = require("./bot/buttons/index.js");
const { inlineSearch } = require("./bot/inline_search.js");
const { textHandler } = require("./bot/commands/textHandler.js");

// set locale
bot.use(async (ctx) => {
    const user = await saveAndGetUser(ctx);
    if (user.language_code == "ru") {
        i18n.setLocale("ru");
    }
    if (user.language_code == "es") {
        i18n.setLocale("es");
    }
});

// commands that always work (without nhentai/telegraph connections)

bot.start(async (ctx) => {
    await saveAndGetUser(ctx);
    let message = i18n.__("greeting");
    try {
        ctx.reply(message, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: i18n.__("random_button"),
                        callback_data: "r"
                    }],
                ],
            },
        })
    } catch (err) {
        console.log(err);
    };
});

bot.help(async (ctx) => {
    await help(ctx);
});
bot.command("code", async (ctx) => {
    try {
        await ctx.reply("Just send me a code")
    } catch (err) {
        return
    }
});
bot.command("settings", async (ctx) => { await settings(ctx); });
bot.command("id", async (ctx) => {
    try {
        await ctx.reply("`" + ctx.from.id + "`", { parse_mode: "Markdown" });
    } catch (err) {
        return
    }
});

// commands with nhentai
bot.command("rand", async (ctx) => { await randomCommand(ctx); });
bot.command("zip", async (ctx) => { await dlzip(ctx); });
// non-text
bot.on("callback_query", async (ctx) => { await cb_query(ctx); });
bot.on("inline_query", async (ctx) => { await inlineSearch(ctx); });

// get with id
bot.on("text", async (ctx) => { await textHandler(ctx); });

// start the bot 

if (process.env.REPL_URL || process.env.HEROKU_URL) {
    start_bot_with_webhook(bot) // with webhook
} else {
    start_bot_with_polling(bot) // with polling
}

async function start_bot_with_webhook(bot: Telegraf<Context<Update>>) {
    const domain = process.env.REPL_URL || process.env.HEROKU_URL
    const port = Number(process.env.PORT) || 3000
    require("./express").startListen(port, domain, bot)
}
async function start_bot_with_polling(bot: Telegraf<Context<Update>>) {
    await bot.launch({
        dropPendingUpdates: true
    })
    console.log("Bot is started polling!")
}