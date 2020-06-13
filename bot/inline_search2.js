const { API, } = require('nhentai-api');
const api = new API();

const { tagStringInline, getMessageInline, getTitle } = require("./someFuncs.js");

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
  return s2;
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
        pageNumber = 1
    
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
    const search = await api.search(inlineQuery, pageNumber).catch(err=>{
      console.log(err);
    });
    if(!search){return}
    let books = search.books;
    
    console.log(books[0])
    
    if (books && books.length) {
      for (let i = 0; i < books.length; i++) {
      let tags = tagStringInline(books[i])
        books[i].message_text = getMessageInline(
          books[i], tags
        );
        books[i].description = tags;
      }
      let searchType = "article"
      
      const results = books.map(manga => ({
        id: manga.id,
        type: searchType,
        title: getTitle(manga),
        description: manga.description,
        thumb_url: 'https://t5.nhentai.net/galleries/' + manga.id + '/thumb.jpg',// + manga.cover.type.extension,
        input_message_content: {
          message_text: manga.message_text,
          parse_mode: "HTML"
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

      console.log(results[0])
      ctx.answerInlineQuery(results);
      
    } else {
      // ctx.answerInlineQuery([]);
  }
};
}