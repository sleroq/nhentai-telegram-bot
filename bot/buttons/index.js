
module.exports.qb_query = async function(ctx, next) {
  let query_data = ctx.update.callback_query.data;
  console.log(query_data);

  if (query_data[0] == 'r') {
    await random(ctx);
  } /* else if (query_data.match("fixInstantView_")) {
    await fixInstantView(ctx);
  } else if (query_data.match("prevManga")) {
    await previousManga(ctx);
  } else if (query_data.match("openintelegraph")) {
    await openiInTelegraph(ctx);
  } */
};
