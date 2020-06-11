const nhentai = require("nhentai-js");

const {
  doujinExists,
  getDoujin,
  getMangaMessage
} = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");

module.exports.openiInTelegraph = async function(ctx, nextM) {
  let mangaId = ctx.update.callback_query.data.split("_")[1],
    manga = await getDoujin(mangaId),
    telegrapfLink = await TelegraphUploadByUrls(manga),
    messageText = getMangaMessage(manga, telegrapfLink);
  await ctx.editMessageText(messageText, {
    parse_mode: "Markdown"
  });
}