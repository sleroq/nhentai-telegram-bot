const nhentai = require("../../nhentai");

const { TelegraphUploadByUrls } = require("../telegraph.js");
const { getMangaMessage } = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");

const Manga = require("../../models/manga.model");
const Message = require("../../models/message.model");

module.exports.textHandler = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  /* I don't want it to work in group chats because
     it will trigger at every numbers, that somebody sent */
  if (
    ctx.message.chat.type != "private" ||
    (ctx.message.via_bot &&
      (ctx.message.via_bot.username == "nhentai_mangabot" ||
        ctx.message.via_bot.username == "nhentai_searchbot"))
  ) {
    return;
  }
  let message_text = ctx.message.text,
    match = message_text.match(/\d+/gm);
  if (match && match[0]) {
    for (let i = 0; i < match.length; i++) {
      let manga_id = match[i],
        manga,
        telegraph_url,
        savedManga;
      // check if we already have this manga in db:
      manga = await Manga.findOne({ id: manga_id });
      // get it if we don't:
      if (!manga || !manga.telegraph_url) {
        manga = await nhentai.getDoujin(match[0]).catch((err) => {
          console.log(err.status);
        });
        if (!manga) {
          ctx
            .reply("`" + manga_id + "` does not exist :/", {
              parse_mode: "Markdown",
            })
            .catch((err) => console.log(err));
          return;
        }
        telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
          console.log(err);
        });
        if (!telegraph_url) {
          console.log("!telegraph_url - return");
          return;
        }
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
      } else {
        telegraph_url = manga.telegraph_fixed_url
          ? manga.telegraph_fixed_url
          : manga.telegraph_url;
      }
      let message = new Message({
        chat_id: ctx.update.message.from.id,
        message_id: ctx.update.message.message_id,
        current: 0,
        history: [],
      });
      let messageText = getMangaMessage(manga, telegraph_url, ctx.i18n),
        heart = user.favorites.id(manga.id) ? "♥️" : "🖤",
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
      let num_of_pages = manga.details ? manga.details.pages : manga.pages;
      let isFullColor = manga.tags ? manga.tags.includes('full color') : manga.details.tags.includes('full color');

      if (!manga.telegraph_fixed_url && (num_of_pages > 100 || isFullColor)) {
        inline_keyboard[0].unshift({
          text: ctx.i18n.t("fix_button"),
          callback_data: "fix_" + manga.id,
        });
      }
      message.history.push(manga_id);
      await message.save();
      user.manga_history.push(manga_id);
      user.save();

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
    }
  }
};
