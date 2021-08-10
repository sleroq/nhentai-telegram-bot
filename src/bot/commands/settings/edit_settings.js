const { saveAndGetUser } = require("../../../db/save_and_get_user");
const { isSafeModeOn, toggle_safe_mode } = require("./safe_mode");
const api = require('../../../api');
const nhentai = require("../../../nhentai");

async function edit_message(user, ctx) {
  let search_type =
    user.search_type == "article" ?
      ctx.i18n.t("article") :
      ctx.i18n.t("gallery"),
    search_sorting =
      user.search_sorting == "date" ?
        ctx.i18n.t("date") :
        ctx.i18n.t("popular"),
    random_localy = user.random_localy ? ctx.i18n.t("yes") : ctx.i18n.t("no"),
    can_repeat_in_random = user.can_repeat_in_random ?
      ctx.i18n.t("yes") :
      ctx.i18n.t("no"),
    language = ctx.i18n.t("current_language"),
    safe_mode_text = ctx.i18n.t("safe_mode") + (isSafeModeOn(user) ? ctx.i18n.t("enabled") : ctx.i18n.t("disabled"))

  await ctx
    .editMessageText(ctx.i18n.t("settings"), {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{
            text: ctx.i18n.t("search_appearance") + search_type,
            callback_data: "change_search_type",
          }],
          [{
            text: ctx.i18n.t("search_sorting") + search_sorting,
            callback_data: "change_search_sorting",
          }],
          [{
            text: ctx.i18n.t("random_localy") + random_localy,
            callback_data: "changa_rangom_localy",
          }],
          [{
            text: safe_mode_text,
            callback_data: "toggle_safe_mode",
          }],
          [{
            text: ctx.i18n.t("about_settings"),
            url: "https://telegra.ph/Settings-04-09",
          }],
          [{
            text: language,
            callback_data: "change_language",
          },],
        ],
      },
    })
    .catch((err) => {
      console.log(err);
    });
}
module.exports.edit_settings = async function (ctx) {
  const query_data = ctx.update.callback_query.data;
  let user = await saveAndGetUser(ctx);
  if (query_data == "settings" || query_data == "back_to_settings") {
    await edit_message(user, ctx);
  } else if (query_data == "change_search_type") {
    user.search_type = user.search_type == "article" ? "photo" : "article";
    user.save();
    await edit_message(user, ctx);
  } else if (query_data == "change_search_sorting") {
    user.search_sorting = user.search_sorting == "date" ? "popular" : "date";
    user.save();
    await edit_message(user, ctx);
  } else if (query_data == "can_repeat_in_random") {
    user.can_repeat_in_random = user.can_repeat_in_random ? false : true;
    user.save();
    await edit_message(user, ctx);
  } else if (query_data == "changa_rangom_localy") {
    user.random_localy = user.random_localy ? false : true;
    user.save();
    await edit_message(user, ctx);
  } else if (query_data == "toggle_safe_mode") {
    await toggle_safe_mode(user)
    await edit_message(user, ctx);
  }
}
