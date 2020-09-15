const nhentai = require("../nhentai");
const Manga = require("../models/manga.model");

async function getRandomManga() {
  let homepage = await nhentai.getHomepage(),
    newestMangaId = +homepage.results[0].id;
  for (let i = 0; i < 15; i++) {
    let randomId = Math.floor(Math.random() * newestMangaId) + 1,
      manga = await nhentai.getDoujin(randomId).catch((err) => {
        console.log(err.status);
        i -= 1;
      });

    return manga;
  }
}
// getRandomMangaLocaly(["group"], ["rape"]);
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
  let title = getTitle(manga),
    tags = tagString(manga),
    pages = manga.details ? manga.details.pages : manga.pages,
    caption;
  if (telegraphLink) {
    caption = `<a href="${telegraphLink}">${title
      .replace(/>/g, " ")
      .replace(/</g, " ")}</a> (${pages} ${i18n.t(
      "pages"
    )})\n${tags}\n<a href="${manga.link}">nhentai.net</a> | <code>${
      manga.id
    }</code>`;
  } else {
    caption = `<a href="${manga.link}">${title
      .replace(/>/g, " ")
      .replace(/</g, " ")}</a> (${pages} ${i18n.t(
      "pages"
    )})\n${tags}\n<a href="${manga.link}">nhentai.net</a> | <code>${
      manga.id
    }</code>`;
  }
  return caption;
}
function tagString(manga) {
  let tags = "Tags: ";
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

  let s1 = s.substr(0, middle);
  let s2 = s.substr(middle + 1);
  return s2;
}
function getMessageInline(manga) {
  let link = "https://nhentai.net/g/" + manga.id + "/",
    message_text = `<a href="${link}">${manga.title
      .replace(/>/g, " ")
      .replace(/</g, " ")}</a>`;
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
  getRandomManga,
  getMangaMessage,
  getMessageInline,
  getRandomMangaLocaly,
  // getTitle,
  sliceByHalf,
  tagString,
};
