module.exports.help = async function (ctx) {
  await ctx.reply(ctx.i18n.t("help"), {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: ctx.i18n.t("search_tips_button"),
            callback_data: "searchtips",
          },
        ],
      ],
    },
  }).catch((err)=>{return})
};
