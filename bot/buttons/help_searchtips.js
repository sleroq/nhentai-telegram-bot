module.exports.searchtips = async function (ctx) {
  await ctx
    .editMessageText(ctx.i18n.t("search_tips"), {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: ctx.i18n.t("back_button"),
              callback_data: "helpsearchback",
            },
            {
              text: ctx.i18n.t("search"),
              switch_inline_query_current_chat: "",
            },
          ],
        ],
      },
    })
    .catch((err) => {
      console.log(err);
    });
};
