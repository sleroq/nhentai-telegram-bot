const nhentai = require("nhentai-js");
const db = require("../../db/dbhandler.js");

const {
  doujinExists,
  getDoujin,
  getMangaMessage
} = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");

module.exports.openiInTelegraph = async function(ctx) {
  let mangaId = ctx.update.callback_query.data.split("_")[1],
    manga = await getDoujin(mangaId);
  if (!manga) {return;}
  let dbMangaRecord = await db.getManga(mangaId),
      telegrapfLink = await TelegraphUploadByUrls(manga),
      inline_keyboard = [
        [{ text: "Telegra.ph", url: telegrapfLink }]
        ],
    messageText = getMangaMessage(manga, telegrapfLink);
    if (dbMangaRecord.fixed == 0) {
    inline_keyboard[0].unshift({
      text: "Fix",
      callback_data: "fix_" + mangaId
    });
  }
  await ctx.editMessageText(messageText, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: inline_keyboard
    }
  });
}