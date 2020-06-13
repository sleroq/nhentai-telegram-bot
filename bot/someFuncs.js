const nhentai = require("nhentai-js");

async function doujinExists(id) {
  const val = await nhentai.exists(id);
  return val;
}

async function getDoujin(id) {
  const val = await nhentai.getDoujin(id).catch(err => {
    console.log(err);
  });
  return val;
}
async function getRandomManga() {
  let homepage = await nhentai.getHomepage(),
    newestMangaId = +homepage.results[0].bookId;
  for (let i = 0; i < 100; i++) {
    let randomId = Math.floor(Math.random() * newestMangaId) + 1,
      manga = await getDoujin(randomId.toString());
    if (doujinExists("randomId")) {
      return manga;
    }
  }
}
function getMangaMessage(manga, telegraphLink) {
  let title = getTitle(manga),
    tags = manga.details.tags ? tagString(manga) : "",
    caption,
    mangaId = manga.link.match(/\d+/)[0];
  if (telegraphLink) {
    caption = `<a href="${telegraphLink}">${title}</a> (${
      manga.details.pages[0]
    } pages)\n${tags}\n<a href="${
      manga.link
    }">nhentai.net</a> | <code>${mangaId}</code>`;
  } else {
    caption = `<a href="${manga.link}">${title}</a> (${
      manga.details.pages[0]
    } pages)\n${tags}\n<a href="${
      manga.link
    }">nhentai.net</a> | <code>${mangaId}</code>`;
  }
  return caption;
}
function tagString(manga) {
  let tags = "Tags: ",
    tagsArray = manga.details.tags[0]
      .replace(/\d+K/gm, 123) // replace number of doujins with number
      .replace(/-+/gm, "_") // replace all dashes
      .replace(/\s+/gm, "_") // replace all spaces
      .split(/\d+/gm); // split by number of doujins
  for (let i = 0; i < tagsArray.length; i++) {
    if (tagsArray && tagsArray[i]) {
      tags += "#" + tagsArray[i];
    }
    if (i != tagsArray.length - 1 && tagsArray[i + 1] != "") {
      tags += ", ";
    }
  }
  return tags;
}
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
function getMessageInline1(manga) {
  let title = getTitle(manga),
    link = "https://nhentai.net/g/" + manga.id + "/",
    message_text = `<a href="${link}">${title}</a>`;
  return message_text;
}
function getTitle(manga) {
  let title;
  if (manga.title) {
    if (manga.title.pretty) {
      title = manga.title.pretty;
    } else if (manga.title.english) {
      title = manga.title.english;
    } else if (manga.title.japanese) {
      title = manga.title.japanese;
    } else if (manga.title.chinese) {
      title = manga.title.chinese;
    } else {
      title = manga.title;
    }
  }
  return title;
}
module.exports = {
  doujinExists,
  getDoujin,
  getRandomManga,
  getMangaMessage,
  getMessageInline1,
  getTitle,
  sliceByHalf,
  tagString
};
