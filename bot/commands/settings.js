const Manga = require("../../models/manga.model");
const Message = require("../../models/message.model");
const { saveAndGetUser } = require("../../db/saveAndGetUser");

module.exports.settings = async function (ctx) {
  let user = saveAndGetUser(ctx),
    search_type = user.search_type ? user.search_type : "article",
    random_localy = user.random_localy ? "yes" : "no",
    can_repeat_in_random = user.can_repeat_in_random
      ? user.can_repeat_in_random
      : ": yes";
  await ctx.reply(ctx.i18n.t("settings"), {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Search appearance : " + search_type,
            callback_data: "searchtips",
          },
        ],
        [
          {
            text: "Random Localy : " + random_localy,
            callback_data: "searchtips",
          },
        ],
      ],
    },
  });
};
