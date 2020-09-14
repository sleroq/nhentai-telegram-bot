const nhentai = require("../nhentai");
const User = require("../models/user.model");

const { getMessageInline, sliceByHalf } = require("./someFuncs.js");
const { saveAndGetUser } = require("../db/saveAndGetUser");

module.exports.inlineSearch = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  if (ctx.inlineQuery.query) {
    let inlineQuery = ctx.inlineQuery.query,
      pageNumber = 1,
      pageMatch = inlineQuery.match(/\/p\d+/g)
        ? inlineQuery.match(/\/p\d+/g)[0]
        : undefined,
      isPageModified = false;
    if (pageMatch) {
      isPageModified = true;
      pageNumber = pageMatch.slice(2);
      inlineQuery = inlineQuery.replace(pageMatch, "").trim();
    }
    // console.log(user);
    let sortingParametr = user.default_search_sorting
        ? user.default_search_sorting
        : "date",
      sortMatch = inlineQuery.match(/\/s[pn]/)
        ? inlineQuery.match(/\/s[pn]/)[0]
        : undefined,
      isSearchModified = false;

    if (sortMatch) {
      isSearchModified = true;
      sortingParametr = sortMatch.slice(2) == "p" ? "popular" : "date";
      inlineQuery = inlineQuery.replace(sortMatch, "").trim();
    }
    console.log(
      'search query="' +
        inlineQuery +
        '" page=' +
        pageNumber +
        " sorting by " +
        sortingParametr
    );
    if (!inlineQuery) {
      return;
    }
    const search = await nhentai
      .search(inlineQuery, pageNumber, sortingParametr)
      .catch((err) => {
        console.log(err);
      });
    // console.log(search);
    if (!search) {
      return;
    }
    let books = search.results;
    // console.log(books);
    let results = [],
      searchType = user.search_type ? user.search_type : "article";
    console.log(searchType);
    if (books && books.length) {
      for (let i = 0; i < books.length; i++) {
        books[i].message_text = getMessageInline(books[i]);
        books[i].description = books[i].language
          ? books[i].language
          : sliceByHalf(books[i].title);
      }

      results = books.map((manga) => ({
        id: manga.id,
        type: searchType,
        title: manga.title
          .split(/\[.*?\]/)
          .join("")
          .trim(),
        description: manga.description,
        thumb_url: manga.thumbnail,
        photo_url: manga.thumbnail,
        input_message_content: {
          message_text: manga.message_text,
          parse_mode: "HTML",
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open",
                callback_data: "open_" + manga.id,
              },
            ],
          ],
        },
      }));
      let reverseSortingWord =
          sortingParametr == "popular" ? "new" : "popularity",
        reverseSortingPhotoUrl =
          sortingParametr == "popular"
            ? "https://i.imgur.com/wmHyvQk.png"
            : "https://i.imgur.com/kMsyvIX.png",
        reverseSortingParametr = reverseSortingWord.charAt(0),
        searchSortingSwitch = isPageModified
          ? `/p${pageNumber} /s${reverseSortingParametr} ${inlineQuery}`
          : `/s${reverseSortingParametr} ${inlineQuery}`;
      results.unshift({
        id: 43210,
        type: searchType,
        title: "To sort results by " + reverseSortingWord,
        description: `Just add "/s${reverseSortingParametr}" to search qerry: (@nhentai_mangabot ${searchSortingSwitch})`,
        photo_url: reverseSortingPhotoUrl,
        thumb_url: reverseSortingPhotoUrl, //"https://cdn.glitch.com/project-avatar/37fdc347-68f3-41ad-8166-f97f2fbc8ebf.png",
        input_message_content: {
          message_text:
            "To sort search results by " +
            reverseSortingWord +
            " you can *add /s" +
            reverseSortingParametr +
            "*",
          parse_mode: "Markdown",
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Sort by " + reverseSortingWord,
                switch_inline_query_current_chat: searchSortingSwitch,
              },
            ],
          ],
        },
      });
      let sortingParametrLetter = sortingParametr == "popular" ? "p" : "n",
        nextPageSwitch = isSearchModified
          ? `/p${+pageNumber + 1} /s${sortingParametrLetter} ${inlineQuery}`
          : `/p${+pageNumber + 1} ${inlineQuery}`;
      results.push({
        id: 4321,
        type: searchType,
        title: "Next page",
        description: `Just add "/p${
          +pageNumber + 1
        }" to search qerry: (@nhentai_mangabot ${nextPageSwitch})`,
        photo_url: "https://i.imgur.com/3AMTdoA.png",
        thumb_url: "https://i.imgur.com/3AMTdoA.png", //"https://cdn.glitch.com/project-avatar/37fdc347-68f3-41ad-8166-f97f2fbc8ebf.png",
        input_message_content: {
          message_text:
            "To view specific page you can *add /p*`n` to the search query, where `n` is page number",
          parse_mode: "Markdown",
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Next page",
                switch_inline_query_current_chat: nextPageSwitch,
              },
            ],
          ],
        },
      });
      // console.log(results[results.length-1]);
    } else {
      results.push({
        id: 4321,
        type: searchType,
        title: "Nothing is found",
        description: ``,
        photo_url: "https://i.imgur.com/j2zt4j7.png",
        thumb_url: "https://i.imgur.com/j2zt4j7.png",
        input_message_content: {
          message_text:
            "• To open a specific doujin just send me nhentai's link or nuclear code\n" +
            "• Also you can download images in .zip file with /zip command. For example: `/zip 234638`",
          parse_mode: "Markdown",
        },
        reply_markup: {
          inline_keyboard: [
            [{ text: "Search tips", callback_data: "searchtips" }],
            [{ text: "Settings", callback_data: "settings" }],
          ],
        },
      });
    }
    await ctx.answerInlineQuery(results).catch((err) => console.log(err));
  }
};
