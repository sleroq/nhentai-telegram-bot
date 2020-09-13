const nhentai = require("../../nhentai");

const { TelegraphUploadByUrls } = require("../telegraph.js");
const { getMangaMessage } = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");

const Manga = require("../../models/manga.model");
const Message = require("../../models/message.model");

module.exports.prevButton = async function (ctx) {
  await saveAndGetUser(ctx);
  let message = await Message.findOne({
    message_id: ctx.update.callback_query.message.message_id,
    chat_id: ctx.update.callback_query.message.from.id,
  });
  if (!message || message.history.length == 1) {
    console.log("return");
    return;
  }
  message.current -= 1;
  message.save();
  // console.log(message.current);
  // console.log(message.history);

  let manga = await Manga.findOne({ id: message.history[message.current] }),
    telegraph_url;

  if (!manga) {
    manga = await nhentai.getDoujin(message.history[message.current]);
    if (!manga) {
      console.log("!manga");
      return;
    }
    telegraph_url = await TelegraphUploadByUrls(manga);
    let savedManga = new Manga({
      id: manga.id,
      title: manga.title,
      description: manga.language,
      tags: manga.details.tags,
      telegraph_url: telegraph_url,
      pages: manga.details.pages,
    });
    savedManga.save(function (err) {
      if (err) return console.error(err);
      console.log("manga saved");
    });
  } else {
    telegraph_url = manga.telegraph_fixed_url
      ? manga.telegraph_fixed_url
      : manga.telegraph_url;
  }
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
  if (!manga.telegraph_fixed_url && num_of_pages > 100) {
    inline_keyboard[0].unshift({
      text: ctx.i18n.t("fix_button"),
      callback_data: "fix_" + manga.id,
    });
  }
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
