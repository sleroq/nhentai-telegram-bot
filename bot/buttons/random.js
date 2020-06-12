const nhentai = require("nhentai-js");

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
  if (!manga) {return;}
  let telegrapfLink = await TelegraphUploadByUrls(manga),
    messageText = getMangaMessage(manga, telegrapfLink),
    manga_id = manga.link.slice(22, -1)
  await ctx.editMessageText(messageText, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Fix", callback_data: 'fix_' + manga_id }, { text: "Telegra.ph", url: telegrapfLink }],
        [{ text: "Search", switch_inline_query_current_chat: "" }],
        [{ text: "Next", callback_data: "r_prev" + manga_id }]
      ]
    }
  });
  // const search = await nhentai.search('yuri');
// console.log(search)
};
