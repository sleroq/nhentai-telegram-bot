require("dotenv").config();

const { Telegraf, session } = require("telegraf");
const I18n = require("telegraf-i18n");
const path = require("path");
const bot = new Telegraf(process.env.BOT_TOKEN);
const i18n = new I18n({
    directory: path.resolve(__dirname, "locales"),
    defaultLanguage: "en",
    sessionName: "session",
    useSession: true,
    templateData: {
        pluralize: I18n.pluralize,
        uppercase: (value) => value.toUpperCase(),
    },
});
bot.use(i18n.middleware())
//coonnect to the database
const mongoose = require("mongoose");
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

// commands that always work (without nhentai/telegraph connections)

bot.start(async (ctx) => {
    await saveAndGetUser(ctx);
    let message = ctx.i18n.t("greeting");
    try {
        ctx.reply(message, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: ctx.i18n.t("random_button"),
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

async function start_bot_with_webhook(bot) {
    const domain = process.env.REPL_URL || process.env.HEROKU_URL
    const port = Number(process.env.PORT) || 3000
    require("./express").startListen(port, domain, bot)
}
async function start_bot_with_polling(bot) {
    await bot.launch({
        dropPendingUpdates: true
    })
    console.log("Bot is started polling!")
}