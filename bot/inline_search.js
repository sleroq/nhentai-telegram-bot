const nhentai = require("../nhentai");

const {
  getMessageInline,
  sliceByHalf,
  getMangaMessage,
} = require("./someFuncs.js");
const { TelegraphUploadByUrls } = require("./telegraph.js");
const { saveAndGetUser } = require("../db/saveAndGetUser");
const Manga = require("../models/manga.model");

module.exports.inlineSearch = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  if (!ctx.inlineQuery.query || ctx.inlineQuery.query.startsWith("/fav")) {
    let searchType = /*user.search_type ? user.search_type :*/ "article",
      favorites = user.favorites;
    if (!favorites && !favorites[0]) {
      return;
    }
    for (let i = 0; i < favorites.length; i++) {
      /* it's in for loop and not in .map below
           because maybe there will be promises */
      favorites[i].message_text = getMangaMessage(
        favorites[i],
        favorites[i].telegraph_url,
        ctx.i18n
      );
      favorites[i].description = sliceByHalf(favorites[i].title);
      let heart = user.favorites.id(favorites[i].id) ? "♥️" : "🖤";
      favorites[i].inline_keyboard = [
        [
          { text: "Telegra.ph", url: favorites[i].telegraph_url },
          { text: heart, callback_data: "like_" + favorites[i].id },
        ],
      ];
      if (favorites[i].pages > 100) {
        inline_keyboard[0].unshift({
          text: ctx.i18n.t("fix_button"),
          callback_data: "fix_" + manga.id,
        });
      }
    }

    let results = favorites.map((manga) => ({
      id: Math.floor(Math.random() * 10000000), //manga.id,
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
        inline_keyboard: manga.inline_keyboard,
      },
    }));
    results.push({
      id: 4321,
      type: searchType,
      title: "Favorites",
      description: `This is your favorites, tap here to refresh them!`,
      photo_url: "https://i.imgur.com/TmxG1Qr.png",
      thumb_url: "https://i.imgur.com/TmxG1Qr.png",
      input_message_content: {
        message_text: "Tap to open favorites",
        parse_mode: "Markdown",
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "favorites",
              switch_inline_query_current_chat:
                "/fav" + Math.floor(Math.random() * 10000000),
            },
          ],
        ],
      },
    });
    await ctx
      .answerInlineQuery(results.reverse(), {
        cache_time: 0,
        is_personal: true,
      })
      .catch((err) => console.log(err));
    return;
  }
  let inlineQuery = ctx.inlineQuery.query,
    pageNumber = 1,
    pageMatch = inlineQuery.match(/\/p\d+/g) // if page specified
      ? inlineQuery.match(/\/p\d+/g)[0]
      : undefined,
    isPageModified = false,
    searchType = user.search_type ? user.search_type : "article";
  if (pageMatch) {
    // ("@bot /p35 smth")
    isPageModified = true; // need this to add tips based on user's query
    pageNumber = pageMatch.slice(2);
    inlineQuery = inlineQuery.replace(pageMatch, "").trim();
  }
  let sortingParametr = user.search_sorting ? user.search_sorting : "date",
    sortMatch = inlineQuery.match(/\/s[pn]/) // if results order specified
      ? inlineQuery.match(/\/s[pn]/)[0]
      : undefined,
    isSearchModified = false;
  if (sortMatch) {
    // ("@bot /sp smth")
    isSearchModified = true; // need this to add tips based on user's query
    sortingParametr = sortMatch.slice(2) == "p" ? "popular" : "date";
    inlineQuery = inlineQuery.replace(sortMatch, "").trim();
  }
  // console.log(
  //   'search query="' +
  //     inlineQuery +
  //     '" page=' +
  //     pageNumber +
  //     " sorting by " +
  //     sortingParametr
  // );
  const nothingIsFound_result = {
    id: 43210,
    type: searchType,
    title: "Nothing is found ¯_(ツ)_/¯",
    description: ``,
    photo_url: "https://i.imgur.com/j2zt4j7.png",
    thumb_url: "https://i.imgur.com/j2zt4j7.png",
    input_message_content: {
      message_text: ctx.i18n.t("help"),
      parse_mode: "Markdown",
    },
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: ctx.i18n.t("search_tips_button"),
            callback_data: "searchtips",
          },
        ],
        [{ text: ctx.i18n.t("settings_button"), callback_data: "settings" }],
      ],
    },
  };

  if (inlineQuery.match(/\d+/) && inlineQuery.replace(/\d+/, "").trim() == "") {
    let manga_id = inlineQuery.match(/\d+/)[0];
    let result = [],
      telegraph_url,
      manga = await nhentai.getDoujin(manga_id).catch((err) => {
        console.log(err.status);
      });

    // check if we have this manga in db:
    let manga_db = await Manga.findOne({ id: manga_id });
    if (!manga && !manga_db) {
      result.push(nothingIsFound_result);
      await ctx.answerInlineQuery(result).catch((err) => console.log(err));
      return;
    }
    // save it if we don't:
    if (!manga_db) {
      telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
        console.log(err);
      });
      if (!telegraph_url) {
        console.log("!telegraph_url - return");
        return;
      }
      manga_db = new Manga({
        id: manga.id,
        title: manga.title,
        description: manga.language,
        tags: manga.details.tags,
        telegraph_url: telegraph_url,
        pages: manga.details.pages,
      });
      manga_db.save(function (err) {
        if (err) return console.error(err);
        console.log("manga saved");
      });
    } else {
      telegraph_url = manga_db.telegraph_fixed_url
        ? manga_db.telegraph_fixed_url
        : manga_db.telegraph_url;
    }
    if (!telegraph_url) {
      console.log("!telegraph_url (from db)- return");
      return;
    }
    let messageText = getMangaMessage(manga, telegraph_url, ctx.i18n),
      inline_keyboard = [[{ text: "Telegra.ph", url: telegraph_url }]];
    if (!manga_db.telegraph_fixed_url && manga.details.pages > 100) {
      inline_keyboard[0].unshift({
        text: ctx.i18n.t("fix_button"),
        callback_data: "fix_" + manga.id,
      });
    }
    let description;
    if (
      Array.isArray(manga.details.languages) &&
      manga.details.languages.length
    ) {
      description = "";
      for (let t = 0; t < manga.details.languages.length - 1; t++) {
        description += manga.details.languages[t] + " ";
      }
    } else {
      description = sliceByHalf(manga.title);
    }
    result.push({
      id: manga.id,
      type: searchType,
      title: manga.title
        .split(/\[.*?\]/)
        .join("")
        .trim(),
      description: description,
      thumb_url:
        Array.isArray(manga.thumbnails) && manga.thumbnails[0]
          ? manga.thumbnails[0]
          : undefined,
      photo_url: manga.pages[0] ? manga.pages[0] : undefined,
      input_message_content: {
        message_text: messageText,
        parse_mode: "HTML",
      },
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    });
    await ctx.answerInlineQuery(result).catch((err) => console.log(err));
    return;
  }
  if (!inlineQuery) {
    /* incase there is only search specifications
       and no actual search query */
    return;
  }
  const search = await nhentai
    .search(inlineQuery, pageNumber, sortingParametr)
    .catch((err) => {
      console.log(err);
    });
  if (!search) {
    // if err or something
    console.log("!search - return");
    return;
  }
  let books = search.results;
  let results = [];
  if (books && books.length) {
    // incase we found something

    for (let i = 0; i < books.length; i++) {
      /* it's in for loop and not in .map below
         because maybe there will be promises */
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
    // Tips and buttons to help user with search:

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
      thumb_url: reverseSortingPhotoUrl,
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
      description: `TAP HERE or Just add "/p${
        +pageNumber + 1
      }" to search qerry: (@nhentai_mangabot ${nextPageSwitch})`,
      photo_url: "https://i.imgur.com/3AMTdoA.png",
      thumb_url: "https://i.imgur.com/3AMTdoA.png",
      input_message_content: {
        message_text:
          "To view specific page you can *add /p*`n` to the search query, where `n` is page number",
        parse_mode: "Markdown",
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: ctx.i18n.t("next_page_button"),
              switch_inline_query_current_chat: nextPageSwitch,
            },
          ],
        ],
      },
    });
  } else {
    results.push(nothingIsFound_result);
  }
  await ctx.answerInlineQuery(results).catch((err) => console.log(err));
};
