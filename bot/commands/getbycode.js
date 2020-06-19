const nhentai = require("nhentai-js");

const { doujinExists, getDoujin, getMangaMessage } = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");

const db = require("../../db/dbhandler.js");

module.exports.getbycode = async function(ctx) {
  let msg = ctx.message.text,
    mangaId = msg.split(" ")[1].trim(),
    exists = await doujinExists(mangaId);

  if (!exists) {
    ctx.reply("`" + mangaId + "` does not exist :/", {
      parse_mode: "HTML"
    });
    return;
  }
  let manga = await getDoujin(mangaId);

  if (!manga) {
    ctx.reply("Failed to get doujin `" + mangaId + "` :/", {
      parse_mode: "Markdown"
    });
    return;
  }
  let dbMangaRecord = await db.getManga(mangaId),
    telegrapfLink = await TelegraphUploadByUrls(manga),
    messageText = getMangaMessage(manga, telegrapfLink),
    inline_keyboard = [
      [{ text: "Telegra.ph", url: telegrapfLink }],
      [{ text: "Search", switch_inline_query_current_chat: "" }],
      [{ text: "Next", callback_data: "r_prev" + mangaId }]
    ];
    if ((!dbMangaRecord || dbMangaRecord.fixed == 0)&& manga.details.pages[0]>=40) {
    inline_keyboard[0].unshift({
      text: "Fix",
      callback_data: "fix_" + mangaId
    });
  }
  // console.log(manga)
  await ctx.reply(messageText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: inline_keyboard
    }
  });
};
