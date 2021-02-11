const nhentai = require("../nhentai");
const Manga = require("../models/manga.model");

async function getRandomManga() {
  /* get the newest possible id from homepage
     assuming there are latest added doujins  */
  let homepage = await nhentai.getHomepage().catch(err => {
    new Error("failed to get Homepage in getRandomManga()")
  }),
    newestMangaId = +homepage.results[0].id;

  // trying to get manga 10 times (to be sure)
  for (let i = 0; i < 10; i++) {
    let randomId = Math.floor(Math.random() * newestMangaId) + 1,
      manga = await nhentai.getDoujin(randomId).catch((err) => {
        console.log("failed to get Doujin in getRandomManga(), but that's ok - continue")
      });
    if (!manga) {
      continue;
    }
    return manga;
  }
}
async function getRandomMangaLocaly(tags, ninTags) {
  let query =
    (tags != undefined && tags.length != 0) ||
      (ninTags != undefined && ninTags.length != 0)
      ? { tags: {} }
      : undefined;
  if (tags != undefined && tags.length != 0) {
    query.tags.$in = tags;
  }
  if (ninTags != undefined && ninTags.length != 0) {
    query.tags.$nin = ninTags;
  }

  let count = await Manga.countDocuments(query),
    random = Math.floor(Math.random() * count),
    result = await Manga.findOne(query).skip(random);
  return result;
}
function getMangaMessage(manga, telegraphLink, i18n) {
  const title = getTitle(manga),
    tags = tagString(manga, i18n),
    pages_word = i18n.t("pages"),
    pages = manga.details ? manga.details.pages : manga.pages,
    link = telegraphLink ? telegraphLink : manga.link,

    caption = `
    <a href="${link}">${title}</a> (${pages} ${pages_word})
    ${tags}\n<a href="${manga.link}">nhentai.net</a> | <code>${manga.id
      }</code>`;
  return caption;
}
function tagString(manga, i18n) {
  let tags = i18n.t("tags");
  tagsArray = manga.details ? manga.details.tags : manga.tags;
  if (!tagsArray || !tagsArray[0]) {
    return "";
  }
  for (let i = 0; i < tagsArray.length; i++) {
    if (i != tagsArray.length - 1) {
      tags += "#" + tagsArray[i].replace(/\s/, "_").replace(/-/, "_");
    }
    if (i != tagsArray.length - 2) {
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

  // let s1 = s.substr(0, middle);
  let s2 = s.substr(middle + 1);
  return s2;
}
function getMessageInline(manga) {
  let link = "https://nhentai.net/g/" + manga.id + "/",
    title = getTitle(manga),
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
  return title
    .replace(/>/g, " ")
    .replace(/</g, " ");
}
function isFullColor(manga) {
  if(manga.tags || (manga.details && manga.details.tags)){
    let answer = manga.tags ? manga.tags.includes('full color') : manga.details.tags.includes('full color');
    return answer
  }else{
    return false
  }
}
module.exports = {
  getRandomManga,
  getMangaMessage,
  getMessageInline,
  getRandomMangaLocaly,
  sliceByHalf,
  tagString,
  isFullColor,
};
