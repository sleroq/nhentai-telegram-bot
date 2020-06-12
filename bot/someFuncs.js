const nhentai = require("nhentai-js");

async function doujinExists(id) {
  const val = await nhentai.exists(id);
  return val;
}

async function getDoujin(id) {
    // try/catch is the equivalent of Promise.catch() in async/await
    const val = await nhentai.getDoujin(id).catch(err=>{
      console.log(err)
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
    tags = tagString(manga),
    caption;
  if (telegraphLink) {
    caption = `<a href="${telegraphLink}">${title}</a> (${
      manga.details.pages[0]
    } pages)\nTags: ${tags}\n<a href="${manga.link}">nHentai page</a>`;
  } else {
    caption = `<a href="${manga.link}">${title}</a> (${
      manga.details.pages[0]
    } pages)\nTags: ${tags}\n<a href="${manga.link}">nHentai page</a>`;
  }
  return caption;
}
function tagString(manga) {
  let tags = "",
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
function tagStringInline(manga) {
  let tags = "";
  for (let i = 0; i < manga.tags.length; i++) {
    if (manga.tags && manga.tags[i]) {
      tags +=
        "#" + manga.tags[i].name.replace(/-+/gm, "_").replace(/\s+/gm, "_");
    }
    if (i != manga.tags.length - 1) {
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
function getMessageInline(manga, tags) {
  let title = getTitle(manga);

  let link = "https://nhentai.net/g/" + manga.id + "/",
    message_text = `<a href="${link}">${title}</a> (${manga.pages.length} pages)\nTags: ${tags})`;
  return message_text;
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
  getMessageInline,
  getMessageInline1,
  getTitle,
  sliceByHalf,
  tagString,
  tagStringInline
};
