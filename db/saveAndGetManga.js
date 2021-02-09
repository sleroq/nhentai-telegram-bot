const nhentai = require("../nhentai");
const Manga = require("../models/manga.model.js");
const { TelegraphUploadByUrls } = require("../bot/telegraph.js");

const {
  getRandomManga,
  getRandomMangaLocaly
} = require("../bot/someFuncs");

module.exports.saveAndGetManga = async function(id, user) {
  let manga;
  let telegraph_url;

  if (!id) {  // RANDOM NEW MANGA
    if (user.random_localy) {
      // (if randoming only in database records)
      manga = await getRandomMangaLocaly(
        user.default_random_tags,
        user.ignored_random_tags
      );
      console.log('got manga random localy')
    } else { // (if not localy)
      manga = await getRandomManga().catch((err) => {
        console.log(err);
      });

      if (!manga) {
        console.log("!manga - return");
        return;
      }
      console.log(manga.id);
      let isMangaSaved = await Manga.findOne({
        id: manga.id,
      });
      if (isMangaSaved) {
        manga = isMangaSaved;
      } else {
        manga = saveNewManga(manga)
      }
      console.log('got manga random not localy')
    }
  } else {
    manga = await Manga.findOne({ id: id });
    if (!manga) {
      manga = await nhentai.getDoujin(id);
      if (!manga) {
        console.log("!manga");
        return;
      }
      // here telegraph page:

      manga.telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
        console.log(err.status);
      });
      if (!manga.telegraph_url) {
        console.log("!telegraph_url");
        return;
      }
      manga = saveNewManga(manga);
    }
    console.log('got manga by id')
  }

  if (!manga.telegraph_url) {
    if (!manga.images) {
      manga_with_pages = await nhentai.getDoujin(manga.id);
      manga.images = manga_with_pages.pages
      console.log("pages for uploading  fixed")
    }
    manga.telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
      console.log(err.status);
    });
    if (!manga.telegraph_url) {
      console.log("!telegraph_url");
      return;
    }
    manga.save(function(err) {
      if (err) return console.error(err);
    });
  }
  if (!manga.date) {
    manga.date = Date.now();
    manga.save(function(err) {
      if (err) return console.error(err);
    });
    console.log(manga.date)
  }
  // console.log(manga)
  return manga
}
function saveNewManga(manga) {
  // console.log(manga)
  let images = manga.pages
  manga = new Manga({
    id: manga.id,
    title: manga.title,
    description: manga.language,
    tags: manga.details.tags,
    telegraph_url: manga.telegraph_url,
    pages: manga.details.pages,
  });
  manga.save(function(err) {
    if (err) return console.error(err);
    console.log("manga saved");
  });
  manga.images = images;
  return manga
}