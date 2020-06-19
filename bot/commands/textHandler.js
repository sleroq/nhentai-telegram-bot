const nhentai = require("nhentai-js");
const db = require("../../db/dbhandler.js");

const { doujinExists, getDoujin, getMangaMessage } = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");

module.exports.textHandler = async function(ctx) {
  if (
    ctx.message.via_bot &&
    (ctx.message.via_bot.username == "nhentai_mangabot" ||
      ctx.message.via_bot.username == "nhentai_searchbot")
  ) {
    return;
  }
  let message_text = ctx.message.text,
    match = message_text.match(/\d+/gm);
  if (match && match[0]) {
    for (let i = 0; i < match.length; i++) {
      let mangaId = match[i],
        exists = await doujinExists(match[0]);
      if (exists) {
        let manga = await getDoujin(mangaId);
        if (manga) {
          let dbMangaRecord = await db.getManga(mangaId),
            telegrapfLink = await TelegraphUploadByUrls(manga),
            messageText = getMangaMessage(manga, telegrapfLink),
            inline_keyboard = [
              [{ text: "Telegra.ph", url: telegrapfLink }],
              [{ text: "Search", switch_inline_query_current_chat: "" }],
              [{ text: "Next", callback_data: "r_prev" + mangaId }]
            ];
          // console.log(dbMangaRecord);
          if ((!dbMangaRecord || dbMangaRecord.fixed == 0)&& manga.details.pages[0]>=40) {
            inline_keyboard[0].unshift({
              text: "Fix",
              callback_data: "fix_" + mangaId
            });
          }
          await ctx.reply(messageText, {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: inline_keyboard
            }
          });
        } else {
          ctx.reply("Failed to get doujin `" + mangaId + "` :/", {
            parse_mode: "Markdown"
          });
        }
      } else {
        ctx.reply("`" + mangaId + "` does not exist :/", {
          parse_mode: "Markdown"
        });
      }
    }
  }
};
