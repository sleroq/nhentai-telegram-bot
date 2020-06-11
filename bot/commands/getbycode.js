const nhentai = require("nhentai-js");

const { doujinExists, getDoujin, getMangaMessage } = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");

module.exports.getbycode = async function(ctx) {
  let msg = ctx.message.text,
    mangaId = msg.split(" ")[1].trim(),
    exists = await doujinExists(mangaId);
  if (exists) {
    let manga = await getDoujin(mangaId);
    if (!manga) {return;}
    let telegrapfLink = await TelegraphUploadByUrls(manga),
      messageText = getMangaMessage(manga, telegrapfLink),
      manga_id = manga.link.slice(22, -1);
    // console.log(manga)
    await ctx.reply(messageText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Fix", callback_data: 'fix_' + manga_id }, { text: "Telegra.ph", url: telegrapfLink }],
          [{ text: "Search", switch_inline_query_current_chat: "" }],
          [{ text: "Next", callback_data: "r_prev" + manga.id }]
        ]
      }
    });
  }
};
