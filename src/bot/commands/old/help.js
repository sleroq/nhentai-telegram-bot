const config = require('../../config.json');
module.exports.help = async function (ctx) {
  let help_text = ctx.i18n.t("help")
  if (config.donation_wallets != "") {
    help_text += "\n" + ctx.i18n.t("donation_message") + config.donation_wallets
  }
  await ctx.reply(help_text, {
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
  }).catch((err) => { return })
};
