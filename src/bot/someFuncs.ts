import { Verror } from "verror";
import Manga, { MangaSchema } from "../models/manga.model";
import { Doujin } from "../nhentai";

export async function getRandomMangaLocally(includedTags: string[] | undefined, excludedTags: string[] | undefined): Promise<MangaSchema> {
  let query = {
    tags: {
      $in: includedTags,
      $nin: excludedTags
    }
  };
  let count = await Manga.countDocuments(query),
    random = Math.floor(Math.random() * count),
    result = await Manga.findOne(query).skip(random);
  if(!result){
    throw new Verror("Could not get random doujin locally")
  }
  return result;
}
export function getMangaMessage(manga: Doujin | MangaSchema, telegraphLink: string, i18n: I18n): string {
  const title = getTitle(manga),
    tags = tagString(manga, i18n),
    pages_word = i18n.t("pages"),
    pages = Array.isArray(manga.pages) ? manga.pages.length : manga.pages,
    link = telegraphLink ? telegraphLink : manga.url,

    caption = `
<a href="${link}">${title}</a> (${pages} ${pages_word})
${tags}\n<a href="${manga.link}">nhentai.net</a> | <code>${manga.id}</code>`;
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
  if (manga.tags || (manga.details && manga.details.tags)) {
    let answer = manga.tags ? manga.tags.includes('full color') : manga.details.tags.includes('full color');
    return answer
  } else {
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
