const nhentai = require("../../nhentai");

const { TelegraphUploadByUrls } = require("../telegraph.js");
const { getRandomManga, getMangaMessage } = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");

const Manga = require("../../models/manga.model");
const Message = require("../../models/message.model");

module.exports.randomButton = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  ctx
    .editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: ctx.i18n.t("waitabit_button"), callback_data: "wait" }],
      ],
    })
    .catch((err) => {
      console.log(err);
    });
  let message = await Message.findOne({
    message_id: ctx.update.callback_query.message.message_id,
    chat_id: ctx.update.callback_query.message.from.id,
  });

  if (!message) {
    message = new Message({
      chat_id: ctx.update.callback_query.message.from.id,
      message_id: ctx.update.callback_query.message.message_id,
      current: 0,
      history: [],
    });
  } else {
    message.current += 1;
  }
  console.log(message.current);
  console.log(message.history);

  let manga, telegraph_url;

  // console.log(message.current);
  // console.log(message.history.length);

  if (message.current < message.history.length) {
    manga = await Manga.findOne({ id: message.history[message.current] });
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
  } else {
    manga = await getRandomManga();
    if (!manga) {
      console.log("!manga");
      return;
    }
    telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
      console.log(typeof err);
      console.log(err);
    });
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
    message.history.push(manga.id);
  }
  if (!telegraph_url) {
    console.log("runrun");
    telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
      console.log(typeof err);
      console.log(err);
    });
  }
  user.manga_history.push(manga.id);
  message.save();
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
  if (!manga.telegraph_fixed_url && num_of_pages > 100) {
    inline_keyboard[0].unshift({
      text: ctx.i18n.t("fix_button"),
      callback_data: "fix_" + manga.id,
    });
  }
  if (message.current > 0) {
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
