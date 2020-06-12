const nhentai = require("nhentai-js");

const { doujinExists, getDoujin, getMangaMessage } = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");

module.exports.textHandler = async function(ctx) {
  let message_text = ctx.message.text,
    match = message_text.match(/\d+/gm);
  if (match && match[0]) {
    for (let i = 0; i < match.length; i++) {
      
      let mangaId = match[i],
        exists = await doujinExists(match[0]);
      if (exists) {
        let manga = await getDoujin(mangaId);
        if (manga) {
          
          let telegrapfLink = await TelegraphUploadByUrls(manga),
            messageText = getMangaMessage(manga, telegrapfLink);
          await ctx.reply(messageText, {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "Fix", callback_data: "fix_" + mangaId },
                  { text: "Telegra.ph", url: telegrapfLink }
                ],
                [{ text: "Search", switch_inline_query_current_chat: "" }],
                [{ text: "Next", callback_data: "r_prev" + mangaId }]
              ]
            }
          });
          
        } else {
          ctx.reply("Failed to get doujin `" + mangaId + "` :/", {
            parse_mode: "Markdown"
          });
        }
      } else {
        ctx.reply("`" + mangaId + "` does not exist :/", {
            parse_mode: "Markdown"
          });
      }
    }
  }
};
