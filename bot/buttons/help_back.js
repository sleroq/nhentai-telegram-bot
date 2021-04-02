module.exports.help_back = async function (ctx) {
  ctx
    .editMessageText(ctx.i18n.t("help"), {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: ctx.i18n.t("search_tips_button"),
              callback_data: "searchtips",
            },
          ],
          [
            {
              text: ctx.i18n.t("tap_to_open_favorites"),
              switch_inline_query_current_chat: "",
            },
          ],
          [
            {
              text: ctx.i18n.t("tap_to_open_history"),
              switch_inline_query_current_chat: "/h",
            },
          ],
        ],
      },
    })
    .catch((err) => {
      console.log(err);
    });
};
