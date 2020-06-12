const { API, } = require('nhentai-api');
const api = new API();

const { getMangaMessageInline } = require("./someFuncs.js");

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
    "'" +
    ctx.inlineQuery.query +
      "'id: " +
      ctx.inlineQuery.from.id +
      " @" +
      ctx.inlineQuery.from.username
  );
  if (ctx.inlineQuery.query) {
    let inlineQuery = ctx.inlineQuery.query,
        pageNumber = 0
    
    let PageMatch = inlineQuery.match(/\/p\d+/g) ? inlineQuery.match(/\/p\d+/g)[0] : undefined
    if(PageMatch){
      pageNumber = PageMatch.slice(2)
      inlineQuery = inlineQuery.slice(PageMatch.length).trim()
    }
    // let sortingParametr = 'date'
    // let SortMatch = inlineQuery.match(/\/s[pn]/) ? inlineQuery.match(/\/s[pn]/)[0] : undefined
    // if(SortMatch){
    //   sortingParametr = SortMatch.slice(2) == 'p' ? 'popular' : 'date'
    //   inlineQuery = inlineQuery.slice(3).trim()
    // }
    console.log('search query="' + inlineQuery + '" page=' + pageNumber)
    const search = await api.search(inlineQuery, pageNumber);
    let books = search.books;
    
    console.log(books[0])
    /*
    if (books && books.length) {
      for (let i = 0; i < books.length; i++) {
        books[i].message_text = await getMangaDescription(
          books[i]
        );
        books[i].description = await searchDescription(
          books[i]
        );
      }
      const results = books.map(manga => ({
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
    */
  }
};
