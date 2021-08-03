const nhentai = require("../../nhentai");
const config = require('../../config.json');

const { getMangaMessage } = require("../some_functions.js");
const { saveAndGetUser } = require("../../db/save_and_get_user");
const { saveAndGetManga } = require("../../db/save_and_get_manga");

const Message = require("../../models/message.model");

module.exports.prevButton = async function (ctx) {
  const user = await saveAndGetUser(ctx);
  let message = await Message.findOne({
    message_id: ctx.update.callback_query.message.message_id,
    chat_id: ctx.update.callback_query.message.from.id,
  });
  if (!message || message.history.length == 1) {
    console.log("return cause there is no mess in db");
    return;
  }
  message.current -= 1;
  message.save();

  let manga = await saveAndGetManga(message.history[message.current]);
  if (!manga || manga == 404) {
    console.log("couldn't get manga so return")

    ctx.reply("couldn't get manga")
    return
  }
  let telegraph_url = manga.telegraph_fixed_url
    ? manga.telegraph_fixed_url
    : manga.telegraph_url;

  let messageText = getMangaMessage(manga, telegraph_url, ctx.i18n),
    heart = user.favorites.id(manga.id) ? config.like_button_true : config.like_button_false;
  inline_keyboard = [
    [
      { text: "Telegra.ph", url: telegraph_url },
      { text: heart, callback_data: "like_" + manga.id },
    ],
    [
      {
        text: ctx.i18n.t("search_button"),
        switch_inline_query_current_chat: "",
      },
    ],
    [{ text: ctx.i18n.t("next_button"), callback_data: "r_" + manga.id }],
  ];
  // in db number of pages in 'pages' var, but in nhentai it's in 'details.pages':
  let num_of_pages = manga.details ? manga.details.pages : manga.pages;

  /*  for those who click buttons without any reason
      show fix button only if there is really alot of pages: */
  if (!manga.telegraph_fixed_url && num_of_pages > config.pages_to_show_fix_button) {
    inline_keyboard[0].unshift({
      text: ctx.i18n.t("fix_button"),
      callback_data: "fix_" + manga.id,
    });
  }
  // prev button only if user isn't at first manga in history:
  if (message.current != 0) {
    inline_keyboard[2].unshift({
      text: ctx.i18n.t("previous_button"),
      callback_data: "prev_" + manga.id,
    });
  }
  await ctx
    .editMessageText(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    })
    .catch((err) => {
      console.log(err);
    });
};
