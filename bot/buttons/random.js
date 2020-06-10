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
  let manga = await getRandomManga(),
    telegrapfLink = await TelegraphUploadByUrls(manga),
    messageText = getMangaMessage(manga, telegrapfLink);
  await ctx.editMessage(messageText, {
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
