const { randomButton } = require("./random.js");
const { prevButton } = require("./previous");
const { likeButton } = require("./like");
const { openiInTelegraph } = require("./open_in_telegraph.js");
const { fixInstantView } = require("./fix_instant_view.js");
const { searchtips } = require("./help_searchtips.js");
const { help_back } = require("./help_back.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { edit_settings } = require("../settings/edit_settings");

module.exports.cb_query = async function (ctx, next) {
  // await ctx.answerCbQuery().catch((err) => {
  //   console.log(err);
  // });
  const query_data = ctx.update.callback_query.data;
  console.log(query_data);
  if (ctx.update.callback_query && ctx.update.callback_query.date) {
    return
  }

  if (query_data[0] == "r") {
    await randomButton(ctx).catch(err => console.log(err));
  } else if (query_data.match("open")) {
    await openiInTelegraph(ctx).catch((err) => {
      console.log(err);
      return
    });;
  } else if (query_data.match("prev")) {
    await prevButton(ctx).catch((err) => {
      console.log(err);
      return
    });;
  } else if (query_data.match("like_")) {
    await likeButton(ctx);
  } else if (query_data.match("fix_") || query_data.match("fixLater_")) {
    await fixInstantView(ctx);
  } else if (query_data.match("searchtips")) {
    await searchtips(ctx);
  } else if (query_data.match("helpsearchback")) {
    await help_back(ctx);
  } else if (query_data.match("fixing")) {
    await ctx
      .answerCbQuery("Please wait.", true)
      .catch((err) => console.log(err));
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
  } else {
    await edit_settings(ctx)
  }
};
async function editLangs(user, ctx) {
  // supported langs:
  const langs = [
    { name: "Русский", code: "ru" },
    { name: "English", code: "en" },
    { name: "Español", code: "es" },
  ];
  let check = false,
    inline_keyboard = [];
  // add ✅ to currently selected language
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
  /* if language code was not specified in the setings,
     then it's english: */
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
    .catch((err) => { });
}
