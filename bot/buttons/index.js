const { randomButton } = require('./random.js')
const { openiInTelegraph } = require('./open_in_telegraph.js')
const { fixInstantView } = require('./fix_instant_view.js')


module.exports.qb_query = async function(ctx, next) {
  await ctx.answerCbQuery()
  let query_data = ctx.update.callback_query.data;
  console.log(query_data);

  if (query_data[0] == 'r') {
    await randomButton(ctx);
  } else if (query_data.match("open")) {
    await openiInTelegraph(ctx);
  }  else if (query_data.match("fix_")) {
    await fixInstantView(ctx);
  } else if (query_data.match("fixing")) {
    await ctx.answerCbQuery('Please wait.', true);
  }/*else if (query_data.match("prevManga")) {
    await previousManga(ctx);
  } */
};
