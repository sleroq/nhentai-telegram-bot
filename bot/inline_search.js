const nHentaiAPI = require("nhentai-api-js");
const nHentai = new nHentaiAPI();

const { getMangaDescription } = require("./someFuncs.js");
const { sliceByHalf } = require("./someFuncs.js");
const { searchDescription } = require("./someFuncs.js");


module.exports.inlineSearch = async function (ctx){
    console.log(
    ctx.inlineQuery.query +
      "\n" +
      ctx.inlineQuery.from.id +
      " @" +
      ctx.inlineQuery.from.username
  );
  if (ctx.inlineQuery.query) {
    let inlineQuery = ctx.inlineQuery.query;
    function getpagenum() {
      if (inlineQuery.match(/\(p[0-9]+\)/)) {
        let page_num = inlineQuery.split(/\(p/)[1].split(/\)/)[0];
        return page_num;
      } else {
        return 1;
      }
    }
    function getUserTag() {
      if (inlineQuery.match(/\(p[0-9]+\)/)) {
        let userTag = inlineQuery
          .split(/\(p/)[1]
          .split(/\)/)[1]
          .slice(1);
        if (userTag.match(/\(s[pn]+\)/)) {
          let utag = userTag.split(/[np]\)/)[1].slice(1);
          return utag;
        } else if (inlineQuery.match(/\(s[pn]+\)/)) {
          let utag = inlineQuery.split(/[np]\)/)[1].slice(1);
          if (utag.match(/\(p[0-9]+\)/)) {
            let ifp = inlineQuery
              .split(/\(p/)[1]
              .split(/\)/)[1]
              .slice(1);
            return ifp;
          } else {
            return utag;
          }
        } else {
          return userTag;
        }
      } else if (inlineQuery.match(/\(s[pn]+\)/)) {
        let utag = inlineQuery.split(/[np]\)/)[1].slice(1);
        if (utag.match(/(p[0-9]+)/)) {
          let ifp = inlineQuery
            .split(/\(p/)[1]
            .split(/\)/)[1]
            .slice(1);
          // console.log("triggered");
          return ifp;
        } else {
          // console.log("triggered utag");
          return utag;
        }
      } else {
        return ctx.inlineQuery.query;
      }
    }
    function getSort() {
      if (inlineQuery.match(/\(s[pn]+\)/)) {
        if (inlineQuery.split(/\(s/)[1].split(/\)/)[0] == "p") {
          return "popular";
        } else {
          return;
        }
      } else {
        return;
      }
    }
    console.log(
      'user tag: "' +
        getUserTag() +
        '" page number: ' +
        getpagenum() +
        '" sorting parametr: ' +
        getSort()
    );
    const search = await nHentai.search(getUserTag(), getpagenum(), getSort()),
      searchResults = search.results,
          inline = 'true'
    // console.log(searchResults)
    if (searchResults && searchResults.length) {
      for (let i = 0; i < searchResults.length; i++) {
        searchResults[i].message_text = await getMangaDescription(searchResults[i], true);
        searchResults[i].description = await searchDescription(searchResults[i]);
      }
      const results = searchResults.map(manga => ({
        id: manga.id,
        type: "article",
        title: manga.title,
        description: manga.description,
        thumb_url: manga.thumbnail.s,
        input_message_content: {
          message_text: manga.message_text,
          parse_mode: "Markdown"
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open in telegraph",
                callback_data: "open_" + manga.id
              }
            ]
          ]
        }
      }));

      // console.log(results)
      ctx.answerInlineQuery(results);
    } else {
      ctx.answerInlineQuery([]);
    }
  }
}