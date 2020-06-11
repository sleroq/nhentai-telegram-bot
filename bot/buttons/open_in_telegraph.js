const nhentai = require("nhentai-js");

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
  let telegrapfLink = await TelegraphUploadByUrls(manga),
    messageText = getMangaMessage(manga, telegrapfLink);
  await ctx.editMessageText(messageText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Fix", callback_data: 'fix_' + mangaId }, { text: "Telegra.ph", url: telegrapfLink }]
        ]
    }
  });
}