const { saveAndGetUser } = require("../../db/saveAndGetUser");

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
    language = ctx.i18n.t("current_language");
  await ctx
    .editMessageText(ctx.i18n.t("settings"), {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{
            text: ctx.i18n.t("search_appearance") + search_type,
            callback_data: "change_search_type",
          },],
          [{
            text: ctx.i18n.t("search_sorting") + search_sorting,
            callback_data: "change_search_sorting",
          },],
          [{
            text: ctx.i18n.t("random_localy") + random_localy,
            callback_data: "changa_rangom_localy",
          },],
          [{
            text: ctx.i18n.t("allow_repeat_in_random") + can_repeat_in_random,
            callback_data: "can_repeat_in_random",
          },],

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
  if (query_data == "settings" || query_data == "back_to_settings") {
    let user = await saveAndGetUser(ctx);
    await edit_message(user, ctx);
  } else if (query_data == "change_search_type") {
    let user = await saveAndGetUser(ctx);
    user.search_type = user.search_type == "article" ? "photo" : "article";
    user.save();
    await edit_message(user, ctx);
  } else if (query_data == "change_search_sorting") {
    let user = await saveAndGetUser(ctx);
    user.search_sorting = user.search_sorting == "date" ? "popular" : "date";
    user.save();
    await edit_message(user, ctx);
  } else if (query_data == "can_repeat_in_random") {
    let user = await saveAndGetUser(ctx);
    user.can_repeat_in_random = user.can_repeat_in_random ? false : true;
    user.save();
    await edit_message(user, ctx);
  } else if (query_data == "changa_rangom_localy") {
    let user = await saveAndGetUser(ctx);
    user.random_localy = user.random_localy ? false : true;
    user.save();
    await edit_message(user, ctx);
  }
}
