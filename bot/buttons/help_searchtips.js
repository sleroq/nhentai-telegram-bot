module.exports.searchtips = async function(ctx) {
  await ctx.editMessageText(
    "*Search*\n" +
      "• You can change search sorting by adding `/s`_p_ before the search query, " +
      "where _p_ - means popular or _n_ - new, for example: " +
      "`(sp) sex toys`\n" +
      "• You can specify page number by adding `/p`[_n_] before the search query, " +
      "where _n_ - page number, for example: `/p5 sex toys`\n" +
      "• You can search for multiple terms at the same time, " +
      "and this will return only galleries that contain both terms. " +
      "For example, anal tanlines finds all " +
      "galleries that contain both anal and tanlines.\n" +
      "• You can exclude terms by prefixing them with -. " +
      "For example, anal tanlines -yaoi matches all" +
      " galleries matching anal and tanlines but not yaoi.\n" +
      "• Exact searches can be performed by wrapping terms " +
      'in double quotes. For example, `"big breasts"` ' +
      'only matches galleries with `"big breasts"` somewhere in the title or in tags.\n' +
      "• These can be combined with tag namespaces for" +
      ' finer control over the query: `parodies:railgun -tag:"big breast"`.\n' +
      "• You can search for galleries with a specific" +
      " number of pages with pages:20, or with a page range: `pages:>20 pages:<=30.`\n" +
      "• You can search for galleries uploaded within " +
      "some timeframe with uploaded:20d. Valid units are h, d, w, m, y. " +
      "• You can use ranges as well: `uploaded:>20d uploaded:<30d.`",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Back", callback_data: "helpsearchback" },
            { text: "Search", switch_inline_query_current_chat: "" }
          ]
        ]
      }
    }
  );
};
