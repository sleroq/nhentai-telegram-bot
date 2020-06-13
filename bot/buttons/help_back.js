module.exports.help_back = async function(ctx) {
  ctx.editMessageText(
    "• To open a specific doujin just send me nhentai's link or nuclear code\n" +
      "• Also you can download images in .zip file with /zip command. For example: `/zip 234638`",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Search tips", callback_data: "searchtips" }]
        ]
      }
    }
  );
};
