const nhentai = require("../../nhentai");

const { TelegraphUploadByUrls } = require("../telegraph.js");
const { getRandomManga, getMangaMessage } = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");

const Manga = require("../../models/manga.model");
const Message = require("../../models/message.model");

module.exports.randomCommand = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  let manga = await getRandomManga();
  if (!manga) {
    return;
  }

  let telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
      console.log(err);
    }),
    savedManga = new Manga({
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
  if (!manga.telegraph_fixed_url && num_of_pages > 100) {
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
