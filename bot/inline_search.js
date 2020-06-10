const nhentai = require("nhentai-js");
const { doujinExists, getDoujin, getMangaMessage } = require("../someFuncs.js");

function sliceByHalf(s) {
  let middle = Math.floor(s.length / 2);
  let before = s.lastIndexOf(" ", middle);
  let after = s.indexOf(" ", middle + 1);

  if (before == -1 || (after != -1 && middle - before >= after - middle)) {
    middle = after;
  } else {
    middle = before;
  }
  let s1 = s.substr(0, middle);
  let s2 = s.substr(middle + 1);
  console.log(s1);
  console.log(s2);
  return s2;
}
function searchDescription(manga) {
  let title = manga.title;
  if (title.match(/ch/gi)) {
    if (title.split(/ch.\s/i)[1]) {
      return "Ch. " + title.split(/ch.\s/i)[1];
    } else {
      return sliceByHalf(title);
    }
  } else {
    return title;
  }
}

module.exports.inlineSearch = async function(ctx) {
  console.log(
    ctx.inlineQuery.query +
      "\n" +
      ctx.inlineQuery.from.id +
      " @" +
      ctx.inlineQuery.from.username
  );
  if (ctx.inlineQuery.query) {
    let inlineQuery = ctx.inlineQuery.query,
      isPageModified = false,
      isSortModefied = false,
      pageNum = getpagenum(inlineQuery),
      sortParametr = getSort(inlineQuery);

    function getpagenum(inlineQuery) {
      if (inlineQuery.match(/\(p[0-9]+\)/)) {
        isPageModified = true
        let page_num = inlineQuery.split(/\(p/)[1].split(/\)/)[0];
        return page_num;
      } else {
        return 1;
      }
    }
    function getSort(inlineQuery) {
      if (inlineQuery.match(/\(s[pn]+\)/)) {
        isSortModefied = true
        if (inlineQuery.split(/\(s/)[1].split(/\)/)[0] == "p") {
          return "popular";
        } else {
          return "date";
        }
      } else {
        return "date";
      }
    }
    let searchQuery = () =>{
      let result
      if(isSortModefied){
        result = inlineQuery.slice(4)
      }else{
        result = inlineQuery
      }
      if(isPageModified){
        let sliceLength = 3 + pageNum.length
        result = result.slice(sliceLength)
      }
        return result
    }
    console.log(
      'user tag: "' +
        searchQuery() +
        '" page number: ' +
        pageNum +
        '" sorting parametr: ' +
        sortParametr
    );
    const search = await nhentai.search(searchQuery(), pageNum, sortParametr),
      searchResults = search.results,
      inline = "true";
    console.log(searchResults)
    if (searchResults && searchResults.length) {
      for (let i = 0; i < searchResults.length; i++) {
        searchResults[i].message_text = await getMangaDescription(
          searchResults[i],
          true
        );
        searchResults[i].description = await searchDescription(
          searchResults[i]
        );
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
                callback_data: "openintelegraph_" + manga.id
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
};
