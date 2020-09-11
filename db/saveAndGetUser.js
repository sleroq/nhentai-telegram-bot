const User = require("../models/user.model");

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
      default_search_sorting: "date",
      default_search_type: "article",
    });

    await user.save(function (err) {
      if (err) return console.error(err);
      console.log("user saved");
    });
  }
  if (user.language_code == "ru") {
    ctx.i18n.locale("ru");
  }
  return user;
};
