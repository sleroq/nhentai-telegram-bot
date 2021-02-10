const { TelegraphUploadByUrls } = require("../telegraph.js");

const {
  getRandomMangaLocaly,
  getRandomManga,
  getMangaMessage,
} = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { saveAndGetManga } = require("../../db/saveAndGetManga");

const Message = require("../../models/message.model");

module.exports.randomCommand = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  let telegraph_url, manga;

  manga = await saveAndGetManga(undefined, user);
      if(!manga){
        console.log("couldn't get manga so return")
      ctx.reply("couldn't get manga")
      return
    }
  telegraph_url = manga.telegraph_fixed_url
    ? manga.telegraph_fixed_url
    : manga.telegraph_url;

  message = new Message({
    chat_id: ctx.update.message.from.id,
    message_id: ctx.update.message.message_id,
    current: 0,
    history: [],
  });
  message.history.push(manga.id);
  message.save();
  user.manga_history.push(manga.id);
  user.save();

  let messageText = getMangaMessage(manga, telegraph_url, ctx.i18n),
    inline_keyboard = [
      [{ text: "Telegra.ph", url: telegraph_url }],
      [
        {
          text: ctx.i18n.t("search_button"),
          switch_inline_query_current_chat: "",
        },
      ],
      [{ text: ctx.i18n.t("next_button"), callback_data: "r_" + manga.id }],
    ];
  let num_of_pages = manga.details ? manga.details.pages : manga.pages;
  if (!manga.telegraph_fixed_url && num_of_pages > 150) {
    inline_keyboard[0].unshift({
      text: ctx.i18n.t("fix"),
      callback_data: "fix_" + manga.id,
    });
  }
  await ctx
    .reply(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    })
    .catch((err) => {
      console.log(err);
    });
};
