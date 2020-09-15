const { randomButton } = require("./random.js");
const { prevButton } = require("./previous");
const { openiInTelegraph } = require("./open_in_telegraph.js");
const { fixInstantView } = require("./fix_instant_view.js");
const { searchtips } = require("./help_searchtips.js");
const { help_back } = require("./help_back.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");

module.exports.cb_query = async function (ctx, next) {
  await ctx.answerCbQuery().catch((err) => {
    console.log(err);
  });
  let query_data = ctx.update.callback_query.data;
  console.log(query_data);

  if (query_data[0] == "r") {
    await randomButton(ctx);
  } else if (query_data.match("open")) {
    await openiInTelegraph(ctx);
  } else if (query_data.match("prev")) {
    await prevButton(ctx);
  } else if (query_data.match("fix_") /* || query_data.match("tryLater")*/) {
    await fixInstantView(ctx);
  } else if (query_data.match("searchtips")) {
    await searchtips(ctx);
  } else if (query_data.match("helpsearchback")) {
    await help_back(ctx);
  } else if (query_data.match("fixing")) {
    await ctx
      .answerCbQuery("Please wait.", true)
      .catch((err) => console.log(err));
  } else if (query_data == "settings" || query_data == "back_to_settings") {
    let user = await saveAndGetUser(ctx);
    await editSettings(user, ctx);
  } else if (query_data == "change_search_type") {
    let user = await saveAndGetUser(ctx);
    user.search_type = user.search_type == "article" ? "photo" : "article";
    user.save();
    await editSettings(user, ctx);
  } else if (query_data == "can_repeat_in_random") {
    let user = await saveAndGetUser(ctx);
    user.can_repeat_in_random = user.can_repeat_in_random ? false : true;
    user.save();
    await editSettings(user, ctx);
  } else if (query_data == "changa_rangom_localy") {
    let user = await saveAndGetUser(ctx);
    user.random_localy = user.random_localy ? false : true;
    user.save();
    await editSettings(user, ctx);
  } else if (query_data == "change_language") {
    let user = await saveAndGetUser(ctx);
    await editLangs(user, ctx);
  } else if (query_data.match("select_")) {
    let lang = query_data.split("_")[1];
    user = await saveAndGetUser(ctx);
    if (user.language_code == lang) {
      return;
    }
    user.language_code = lang;
    ctx.i18n.locale(lang);
    user.save();
    await editLangs(user, ctx);
  }
};
async function editLangs(user, ctx) {
  const langs = [
    { name: "Русский", code: "ru" },
    { name: "English", code: "en" },
    { name: "Español", code: "es" },
  ];
  let check = false,
    inline_keyboard = [];
  langs.forEach((x) => {
    if (x.code == user.language_code) {
      x.name += " ✅";
      check = true;
    }
    inline_keyboard.push([
      {
        text: x.name,
        callback_data: "select_" + x.code,
      },
    ]);
  });
  if (!check) {
    inline_keyboard[1].text = +" ✅";
  }
  inline_keyboard.push([
    {
      text: ctx.i18n.t("back_button"),
      callback_data: "back_to_settings",
    },
  ]);
  await ctx
    .editMessageText(ctx.i18n.t("choose_a_language"), {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    })
    .catch((err) => {});
}
async function editSettings(user, ctx) {
  let search_type = user.search_type ? user.search_type : "article",
    random_localy = user.random_localy ? ctx.i18n.t("yes") : ctx.i18n.t("no"),
    can_repeat_in_random = user.can_repeat_in_random
      ? ctx.i18n.t("yes")
      : ctx.i18n.t("no"),
    language = ctx.i18n.t("current_language");
  await ctx
    .editMessageText(ctx.i18n.t("settings"), {
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
}
