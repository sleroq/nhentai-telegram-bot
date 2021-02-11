const nhentai = require("../../nhentai");

const { getMangaMessage, isFullColor } = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { saveAndGetManga } = require("../../db/saveAndGetManga");

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
        telegraph_url;
      console.log("textHandler started work on " + manga_id)

      manga = await saveAndGetManga(manga_id).catch(err => {
        console.log(err)
      })
      if (!manga) {
        console.log("no manga in textHandler, continue")
        continue;
      }

      telegraph_url = manga.telegraph_fixed_url
        ? manga.telegraph_fixed_url
        : manga.telegraph_url;
      if (!telegraph_url) {
        console.log("no telegraph url in textHandler, continue")
        continue;
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

      if (!manga.telegraph_fixed_url && (num_of_pages > 100 || isFullColor(manga))) {
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
      if (match.length !== 1 && i === match.length - 1) {
        console.log("textHandler finished work")
      }
    }
  }
};
