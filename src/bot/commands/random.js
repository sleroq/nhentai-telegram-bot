const { TelegraphUploadByUrls } = require("../telegraph.js");

const config = require('../../config.json');

const {
  getRandomMangaLocaly,
  getRandomManga,
  getMangaMessage,
} = require("../some_functions.js");
const { saveAndGetUser } = require("../../db/save_and_get_user");
const { saveAndGetManga } = require("../../db/save_and_get_manga");

const Message = require("../../models/message.model");

module.exports.randomCommand = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  let telegraph_url, manga;

  manga = await saveAndGetManga(undefined, user);
  if (!manga || manga == 404) {
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
    heart = user.favorites.id(manga.id) ? "♥️" : "🖤",
    inline_keyboard = [
      [
        { text: "Telegra.ph", url: telegraph_url },
        { text: heart, callback_data: "like_" + manga.id }
      ],
      [
        {
          text: ctx.i18n.t("search_button"),
          switch_inline_query_current_chat: "",
        },
      ],
      [{ text: ctx.i18n.t("next_button"), callback_data: "r_" + manga.id }],
    ];
  let num_of_pages = manga.details ? manga.details.pages : manga.pages;
  if (!manga.telegraph_fixed_url && num_of_pages > config.pages_to_show_fix_button) {
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
