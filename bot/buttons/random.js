const nhentai = require("nhentai-js");
const db = require("../../db/dbhandler.js");

const {
  doujinExists,
  getDoujin,
  getRandomManga,
  getMangaMessage
} = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");

module.exports.randomButton = async function(ctx, next) {
  let query_data = ctx.update.callback_query;
  let manga = await getRandomManga();
  if (!manga) {
    return;
  }

  let manga_id = manga.link.slice(22, -1),
    dbMangaRecord = await db.getManga(manga_id),
    telegrapfLink = await TelegraphUploadByUrls(manga),
    messageText = getMangaMessage(manga, telegrapfLink),
    inline_keyboard = [
      [{ text: "Telegra.ph", url: telegrapfLink }],
      [{ text: "Search", switch_inline_query_current_chat: "" }],
      [{ text: "Next", callback_data: "r_prev" + manga_id }]
    ];
  if (!dbMangaRecord || dbMangaRecord.fixed == 0) {
    inline_keyboard[0].unshift({
      text: "Fix",
      callback_data: "fix_" + manga_id
    });
  }
  await ctx
    .editMessageText(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard
      }
    })
    .catch(err => {
      console.log(err);
    });
  // const search = await nhentai.search('yuri');
  // console.log(search)
};
