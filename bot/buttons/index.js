const { randomButton } = require("./random.js");
const { openiInTelegraph } = require("./open_in_telegraph.js");
const { fixInstantView } = require("./fix_instant_view.js");
const { searchtips } = require("./help_searchtips.js");
const { help_back } = require("./help_back.js");

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
  } else if (query_data.match("fix_") /* || query_data.match("tryLater")*/) {
    await fixInstantView(ctx);
  } else if (query_data.match("searchtips")) {
    await searchtips(ctx);
  } else if (query_data.match("helpsearchback")) {
    await help_back(ctx);
  } else if (query_data.match("fixing")) {
    await ctx.answerCbQuery("Please wait.", true).catch(err=>console.log(err));
  }
  /*else if (query_data.match("prevManga")) {
    await previousManga(ctx);
  } */
};
