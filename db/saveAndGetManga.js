const nhentai = require("../nhentai");
const Manga = require("../models/manga.model.js");
const { TelegraphUploadByUrls } = require("../bot/telegraph.js");

const {
  getRandomManga,
  getRandomMangaLocaly
} = require("../bot/someFuncs");

module.exports.saveAndGetManga = async function (id, user) {
  let manga;

  if (!id) {  // RANDOM NEW MANGA
    if (user.random_localy) {
      // (if randoming only in database records)
      manga = await getRandomMangaLocaly(
        user.default_random_tags,
        user.ignored_random_tags
      ).catch((err) => {
        console.log(err);
      });
      if(!manga && (user.default_random_tags.length > 0 || user.ignored_random_tags > 0)){
      console.log("couldn't find manga with such tags")
      return
      }
      if(!manga){
        return
      }
      console.log('got manga random localy')
    } else { // (if not localy)
      manga = await getRandomManga().catch((err) => {
        console.log(err);
      });

      if (!manga) {
        console.log("!manga - return");
        return;
      }
      let isMangaSaved = await Manga.findOne({
        id: manga.id,
      }).catch((err) => {
        console.log(err);
      });
      if (isMangaSaved) {
        manga = isMangaSaved;
      } else {
        manga = saveNewManga(manga)
      }
      console.log('got manga random not localy')
    }
  } else {
    manga = await Manga.findOne({ id: id }).catch((err) => {
      console.log(err);
    });
    if (!manga) {
      manga = await nhentai.getDoujin(id).catch((err) => {
      })
        ;
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
      manga = saveNewManga(manga)
    }
    console.log('got manga by id')
  }

  if (!manga.telegraph_url) {
    if (!manga.images) {
      manga_with_pages = await nhentai.getDoujin(manga.id).catch((err) => {
        // console.log(err);
      });
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
    manga.save(function (err) {
      if (err) return console.error(err);
    });
  }
  // update old manga to new date format
  if (!manga.createdAt || !manga.updatedAt) {
    Manga.updateOne(
      { id: manga.id },
      {
        $set:
        {
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
      }
    )
  }
  //add thumbnail and page if was saved without them
  if (!manga.thumbnail || !manga.page0) {
      console.log('no thumbnail or page0- ' + manga.id)

      let manga_with_thumbnail = await nhentai.getDoujin(manga.id)
    if (Array.isArray(manga_with_thumbnail.thumbnails) && manga_with_thumbnail.thumbnails[0]) {
      manga.thumbnail = manga_with_thumbnail.thumbnails[0];
      console.log('updated thumbnail - ' + manga.id)
    }
    manga.page0 = manga_with_thumbnail.pages[0]
    console.log('updated page0 - ' + manga.id)
    manga.save(function (err) {
      if (err) return console.error(err);
    })
    
  }
  console.log("returning manga")
  return manga
}
function saveNewManga(manga) {
  // console.log(manga)
  let images = manga.pages,
    thumbnail = Array.isArray(manga.thumbnails) && manga.thumbnails[0]
      ? manga.thumbnails[0]
      : undefined,
    page0 = manga.pages[0]

  manga = new Manga({
    id: manga.id,
    title: manga.title,
    description: manga.language,
    tags: manga.details.tags,
    telegraph_url: manga.telegraph_url,
    pages: manga.details.pages,
    thumbnail: thumbnail,
    page0: page0,
  });
  manga.save(function (err) {
    if (err) return console.error(err);
    console.log("manga saved");
  });
  manga.images = images;
  return manga
}