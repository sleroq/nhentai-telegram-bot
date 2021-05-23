const User = require("../models/user.model");
const { awful_tags } = require("../confg.json");
const config = require('../config.json');

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
      search_sorting: config.search_sorting_by_default,
      search_type: config.search_appearance_by_default,
      ignored_random_tags: awful_tags,
      random_localy: config.random_localy_by_default,
      can_repeat_in_random: config.can_repeat_in_random_by_default,
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
