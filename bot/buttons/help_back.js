module.exports.help_back = async function (ctx) {
  ctx
    .editMessageText(ctx.i18n.t("help"), {
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
    })
    .catch((err) => {
      console.log(err);
    });
};
