const Manga = require("../../models/manga.model");
const { saveAndGetUser } = require("../../db/saveAndGetUser");

module.exports.settings = async function (ctx) {
  let user = await saveAndGetUser(ctx),
    search_type = user.search_type ? user.search_type : "article",
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
              text: "Search appearance:  " + search_type,
              callback_data: "change_search_type",
            },
          ],
          [
            {
              text: "Random Localy:  " + random_localy,
              callback_data: "changa_rangom_localy",
            },
          ],
          [
            {
              text: "Allow repeat in random:  " + can_repeat_in_random,
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
