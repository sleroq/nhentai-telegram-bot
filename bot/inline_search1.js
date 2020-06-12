// const { API, } = require('nhentai-api');
// const api = new API();
const nHentaiAPI = require("nhentai-api-js");
const api = new nHentaiAPI();

const { getMessageInline1, sliceByHalf, getTitle } = require("./someFuncs.js");

module.exports.inlineSearch = async function(ctx) {
  console.log(
    "'" +
      ctx.inlineQuery.query +
      "'id: " +
      ctx.inlineQuery.from.id +
      " @" +
      ctx.inlineQuery.from.username
  );
  if (ctx.inlineQuery.query) {
    let inlineQuery = ctx.inlineQuery.query,
      pageNumber = 1;

    let PageMatch = inlineQuery.match(/\/p\d+/g)
      ? inlineQuery.match(/\/p\d+/g)[0]
      : undefined;
    if (PageMatch) {
      pageNumber = PageMatch.slice(2);
      inlineQuery = inlineQuery.replace(PageMatch, '').trim();
    }
    let sortingParametr = "date";
    let SortMatch = inlineQuery.match(/\/s[pn]/)
      ? inlineQuery.match(/\/s[pn]/)[0]
      : undefined;
    if (SortMatch) {
      sortingParametr = SortMatch.slice(2) == "p" ? "popular" : "date";
      inlineQuery = inlineQuery.replace(SortMatch, '').trim();
    }
    console.log('search query="' + inlineQuery + '" page=' + pageNumber + ' sorting by ' + sortingParametr);
    const search = await api
      .search(inlineQuery, pageNumber, sortingParametr)
      .catch(err => {
        console.log(err);
      });
    if (!search) {
      return;
    }
    let books = search.results;

    // console.log(books[0]);

    if (books && books.length) {
      for (let i = 0; i < books.length; i++) {
        books[i].message_text = getMessageInline1(books[i]);
        books[i].description = books[i].language
          ? books[i].language
          : sliceByHalf(books[i].title);
      }
      let searchType = "article";

      const results = books.map(manga => ({
        id: manga.id,
        type: searchType,
        title: getTitle(manga),
        description: manga.description,
        thumb_url: manga.thumbnail.s,
        input_message_content: {
          message_text: manga.message_text,
          parse_mode: "HTML"
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open",
                callback_data: "open_" + manga.id
              }
            ]
          ]
        }
      }));

      // console.log(results[0]);
      ctx.answerInlineQuery(results);
    } else {
      // ctx.answerInlineQuery([]);
    }
  }
};
