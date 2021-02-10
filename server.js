require("dotenv").config();

const { Telegraf } = require("telegraf");
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
bot.use(Telegraf.session());
bot.use(i18n.middleware());

// const migrateSomething = require("./db/dbhandler");
const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("we're connected!");
});

const { saveAndGetUser } = require("./db/saveAndGetUser");
// //modules
const { randomCommand } = require("./bot/commands/random.js");
const { dlzip } = require("./bot/commands/dlzip.js");
const { help } = require("./bot/commands/help.js");
const { settings } = require("./bot/commands/settings.js");

const { cb_query } = require("./bot/buttons/index.js");
const { inlineSearch } = require("./bot/inline_search.js");
const { textHandler } = require("./bot/commands/textHandler.js");

bot.start(async (ctx) => {
  // if (ctx.message.date < 1613000000){
  //   // ctx.reply('too many :((((((\ntry to use search')
  //   console.log("return " + ctx.message.date + " start")
  //   return
  // }else{
  //   console.log(ctx.message.date + "not return - start")
  // }
  const user = await saveAndGetUser(ctx);
  let message = ctx.i18n.t("greeting");
  ctx.reply(message, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: ctx.i18n.t("random_button"), callback_data: "r" }],
      ],
    },
  }).catch((err) => {
    console.log(err);
    return
  });;
});

bot.help(async (ctx) => {
  // if (ctx.message.date < 1613000000){
    
  //   console.log("return " + ctx.message.date)
  //   return
  // }else{
  //   console.log(ctx.message.date + "not return")
  // }
  await help(ctx);
});

bot.command("code", async (ctx) => {
  // if (ctx.message.date < 1613000000){
    
  //   console.log("return " + ctx.message.date)
  //   return
  // }else{
  //   console.log(ctx.message.date + "not return")
  // }
  await ctx.reply("Just send me a code").catch((err)=>{return});
});
bot.command("rand", async (ctx) => {
  if (ctx.message.date < 1613000000){
    
    console.log("return " + ctx.message.date + " rand")
    return
  }else{
    console.log(ctx.message.date + "not return")
  }
  await randomCommand(ctx);
});
bot.command("zip", async (ctx) => {
  // if (ctx.message.date < 1613000000){
    
  //   console.log("return " + ctx.message.date)
  //   return
  // }else{
  //   console.log(ctx.message.date + "not return")
  // }
  await dlzip(ctx);
});
bot.command("id", async (ctx) => {
  // if (ctx.message.date < 1613000000){
    
  //   console.log("return " + ctx.message.date)
  //   return
  // }else{
  //   console.log(ctx.message.date + "not return")
  // }
  await ctx.reply("`" + ctx.from.id + "`");
});
bot.command("settings", async (ctx) => {
  // if (ctx.message.date < 1613000000){
    
  //   console.log("return " + ctx.message.date)
  //   return
  // }else{
  //   console.log(ctx.message.date + "not return")
  // }
  await settings(ctx);
});

bot.on("callback_query", async (ctx, next) => {

  await cb_query(ctx);
});
bot.on("inline_query", async (ctx) => {
  await inlineSearch(ctx);
});
bot.on("text", async (ctx, next) => {
  if (ctx.message.date < 1613000000){
    
    console.log("return " + ctx.message.date + " text")
    return
  }else{
    console.log(ctx.message.date + "not return")
  }
  await textHandler(ctx);
});

if (false){//process.env.REPL_URL) {
  require("./express.js").startListen(bot, process.env.PORT);
} else {
  async function clearOldMessages(tgBot) {
    // Get updates for the bot
    const updates = await tgBot.telegram.getUpdates(0, 100, -1);

    //  Add 1 to the ID of the last one, if there is one
    return updates.length > 0
            ? updates[updates.length-1].update_id + 1
            : 0
    ;
}
bot.polling.offset = clearOldMessages(bot).then((x)=>{console.log(x); return x})

  bot.telegram.deleteWebhook();
  bot.launch().then(() => console.log("Bot is working!"));
}
