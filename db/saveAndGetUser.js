const User = require("../models/user.model");
const { awfulTags } = require("../bot/settings/safe_mode");

module.exports.saveAndGetUser = async function (ctx) {
  let user = await User.findById(ctx.from.id, function (err) {
    if (err) console.log(err);
  });
  if (!user) {
    user = new User({
      _id: ctx.from.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
      language_code: ctx.from.language_code,
      search_sorting: "date",
      search_type: "photo",
      ignored_random_tags: awfulTags,
      random_localy: true,
      can_repeat_in_random: true,
    })

    await user.save(function (err) {
      if (err) return console.error(err);
      console.log("user saved");
    })
  }
  if (user.language_code == "ru") {
    ctx.i18n.locale("ru");
  }
  if (user.language_code == "es") {
    ctx.i18n.locale("es");
  }
  return user;
};
