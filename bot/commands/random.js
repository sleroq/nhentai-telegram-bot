const nhentai = require("nhentai-js");
// const nHentaiAPI = require("nhentai-api-js");
// const nHentai = new nHentaiAPI();

const { doujinExists, getDoujin, getRandomManga, getMangaMessage } = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");

module.exports.randomCommand = async function(ctx) {
  let manga = await getRandomManga(),
    telegrapfLink = await TelegraphUploadByUrls(manga),
    messageText = getMangaMessage(manga, telegrapfLink);
  // console.log(manga)
  await ctx.reply(messageText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Telegra.ph", url: telegrapfLink }],
        [{ text: "Search", switch_inline_query_current_chat: "" }],
        [{ text: "Next", callback_data: "r_prev" + manga.id }]
      ]
    }
  });
};
