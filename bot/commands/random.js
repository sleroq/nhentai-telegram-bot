const nhentai = require("nhentai-js");

const {
  doujinExists,
  getDoujin,
  getRandomManga,
  getMangaMessage
} = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");

const db = require("../../db/dbhandler.js");

module.exports.randomCommand = async function(ctx) {
  let manga = await getRandomManga();
  if (!manga) {
    return;
  }
  let telegrapfLink = await TelegraphUploadByUrls(manga).catch(err=>console.log(err)),
    messageText = getMangaMessage(manga, telegrapfLink),
    manga_id = manga.link.slice(22, -1),
    dbMangaRecord = await db.getManga(manga_id),
    inline_keyboard = [
      [{ text: "Telegra.ph", url: telegrapfLink }],
      [{ text: "Search", switch_inline_query_current_chat: "" }],
      [{ text: "Next", callback_data: "r_prev" + manga_id }]
    ];
  if (!telegrapfLink) {
    return
  }
  if ((!dbMangaRecord || dbMangaRecord.fixed == 0)&& manga.details.pages[0]>=40) {
    inline_keyboard[0].unshift({
      text: "Fix",
      callback_data: "fix_" + manga_id
    });
  }
  await ctx.reply(messageText, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Fix", callback_data: "fix_" + manga_id },
          { text: "Telegra.ph", url: telegrapfLink }
        ],
        [{ text: "Search", switch_inline_query_current_chat: "" }],
        [{ text: "Next", callback_data: "r_prev" + manga.id }]
      ]
    }
  }).catch(err=>console.log(err));
};
