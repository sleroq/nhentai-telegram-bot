const nhentai = require("../nhentai");
const Manga = require("../models/manga.model");

module.exports.saveAndGetManga = async function(id) {
  let manga = await Manga.findOne({ id: id });
  // incase manga somehow disappeared from db - get_it() & save_it():
  if (!manga) {
    manga = await nhentai.getDoujin(id);
    if (!manga) {
      console.log("!manga");
      return;
    }
    // here our telegraph page:
    let telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
      console.log(err.status);
    });
    if (!telegraph_url) {
      return;
    }
    manga = new Manga({
      id: manga.id,
      title: manga.title,
      description: manga.language,
      tags: manga.details.tags,
      telegraph_url: telegraph_url,
      pages: manga.details.pages,
    });
    manga.save(function(err) {
      if (err) return console.error(err);
      console.log("manga saved");
    });
  }
  if (!manga.telegraph_url) {
    manga.telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
      console.log(err.status);
    });
    if (!telegraph_url) {
      return;
    }
    savedManga.save(function(err) {
      if (err) return console.error(err);
    });
  }
  if (!manga.date) {
    manga.date = Date.now;
    savedManga.save(function(err) {
      if (err) return console.error(err);
    });
  }
  return savedManga
}