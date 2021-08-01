import nhentai, { Doujin } from "../nhentai";
import Manga, { MangaSchema } from "../models/manga.model.js";
import TelegraphUploadByUrls from "../bot/telegraph.js"

import { getRandomMangaLocally } from "../bot/someFuncs";
import { UserSchema } from "../models/user.model";
import Verror from "verror";
import { Document } from "mongoose";

export default async function saveAndGetManga(user: UserSchema, id: number | undefined): Promise<MangaSchema & Document<any, any, MangaSchema>> {
  let manga: Doujin | MangaSchema & Document<any, any, MangaSchema> | null = null;
  let images: string[] = [];

  if (!id) {  // RANDOM NEW MANGA
    if (user.random_localy) {
      // (if randoming only in database records)
      try {
        manga = await getRandomMangaLocally(
          user.default_random_tags,
          user.ignored_random_tags
        )
      } catch (error) {
        throw new Verror(error, "Getting doujin locally");
      }
      if (manga === null) {
        throw new Verror("Couldn't find manga with such tags")
      }
      console.log('got manga random localy')
    } else { // (not localy)
      try {
        manga = await nhentai.getRandomDoujin();
        images = manga.pages;
      } catch (error) {
        throw new Verror(error, "Getting random doujin from nhentai");
      }
      let sameMangaInDB: MangaSchema & Document<any, any, MangaSchema> | null = null;
      try {
        sameMangaInDB = await Manga.findOne({ id: manga.id });
      } catch (error) {
        console.log(error);
      }
      if (sameMangaInDB) {
        manga = sameMangaInDB;
      } else {
        try {
          manga = await saveNewManga(manga);
        } catch (error) {
          throw new Verror(error, "Saving doujin")
        }
      }
      console.log('Got manga random locally!')
    }
  } else {
    try {
      manga = await Manga.findOne({ id: id });
    } catch (error) {
      console.log(error);
    }
    if (!manga) {
      try {
        manga = await nhentai.getDoujin(id);
        images = manga.pages;
      } catch (error) {
        throw new Verror(error, "Getting doujin by id");
      }
      manga = await saveNewManga(manga);
    }
    console.log('Got manga by id');
  }

  // Update old manga where telegraph_url was not saved for some reason
  if (!manga.telegraph_url) {
    if (images.length === 0) {
      let mangaWithPages: Doujin | undefined;
      try {
        mangaWithPages = await nhentai.getDoujin(manga.id);
      } catch (error) {
        throw new Verror(error, "Getting images to update manga without telegra.ph url")
      }
      images = mangaWithPages.pages
      console.log("Got pages to fix manga from DB");
    }
    try {
      manga.telegraph_url = await TelegraphUploadByUrls(manga);
    } catch (error) {
      throw new Verror(error, "Posting doujin to telegra.ph to fix manga wothout telegra.pf url")
    }
    manga.save(function (err) {
      if (err) return console.error(err);
    });
  }
  // Update old manga where date was not specified
  if (!manga.createdAt || !manga.updatedAt) {
    await Manga.updateOne(
      { id: manga.id },
      {
        $set:
        {
          createdAt: new Date(),
          updatedAt: new Date()
        },
      }
    )
    console.log('Added date to ' + manga.id)
  }
  // Add thumbnail and first page if was saved without them
  if (!manga.thumbnail || !manga.page0) {
    let mangaWithThumbnail: Doujin | undefined;
    try {
      mangaWithThumbnail = await nhentai.getDoujin(manga.id);
    } catch (error) {
      throw new Verror("Getting manga with thumbnail");
    }
    manga.thumbnail = mangaWithThumbnail.thumbnails[0];
    manga.page0 = mangaWithThumbnail.pages[0];

    try {
      await manga.save()
    } catch (error) {
      console.log("Could not save manga with updated thumbnail and page0: " + manga.id);
      console.log(error)
    }
    console.log("Added thumbnail and page0 to " + manga.id);
  }
  console.log("returning manga");
  return manga
}
async function saveNewManga(manga: Doujin): Promise<MangaSchema & Document<any, any, MangaSchema>> {
  const thumbnail = Array.isArray(manga.thumbnails) && manga.thumbnails[0]
    ? manga.thumbnails[0]
    : undefined;
  const page0 = manga.pages[0];
  const launguage = manga.details.languages
    ? manga.details.languages[manga.details.languages.length - 1]
    : undefined;

  let telegraphUrl: string | undefined;
  try {
    telegraphUrl = await TelegraphUploadByUrls(manga)
  } catch (error) {
    throw new Verror(error, "Posting doujin to telegra.ph")
  }

  const mangaDB = new Manga({
    id: manga.id,
    title: manga.title,
    description: launguage,
    tags: manga.details.tags,
    telegraph_url: telegraphUrl,
    pages: manga.details.pages,
    thumbnail,
    page0,
  });
  try {
    await mangaDB.save();
  } catch (error) {
    console.log("Could not save new manga :(");
    console.log(error);
  }
  console.log("Doujin saved");
  return mangaDB
}