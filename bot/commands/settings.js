const { saveAndGetUser } = require("../../db/saveAndGetUser");

module.exports.settings = async function (ctx) {
  let user = await saveAndGetUser(ctx),
    search_type =
      user.search_type == "article"
        ? ctx.i18n.t("article")
        : ctx.i18n.t("gallery"),
    search_sorting =
      user.search_sorting == "date"
        ? ctx.i18n.t("date")
        : ctx.i18n.t("popular"),
    random_localy = user.random_localy ? ctx.i18n.t("yes") : ctx.i18n.t("no"),
    can_repeat_in_random = user.can_repeat_in_random
      ? ctx.i18n.t("yes")
      : ctx.i18n.t("no"),
    language = ctx.i18n.t("current_language");
  await ctx
    .reply(ctx.i18n.t("settings"), {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: ctx.i18n.t("search_appearance") + search_type,
              callback_data: "change_search_type",
            },
          ],
          [
            {
              text: ctx.i18n.t("search_sorting") + search_sorting,
              callback_data: "change_search_sorting",
            },
          ],
          [
            {
              text: ctx.i18n.t("random_localy") + random_localy,
              callback_data: "changa_rangom_localy",
            },
          ],
          [
            {
              text: ctx.i18n.t("allow_repeat_in_random") + can_repeat_in_random,
              callback_data: "can_repeat_in_random",
            },
          ],

          [
            {
              text: language,
              callback_data: "change_language",
            },
          ],
        ],
      },
    })
    .catch((err) => {});
};
