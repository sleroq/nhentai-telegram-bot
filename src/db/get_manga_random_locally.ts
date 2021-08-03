import Manga from "../models/manga.model";
export default async function getRandomMangaLocally(includedTags: string[] | undefined, excludedTags: string[] | undefined): Promise<MangaSchema & Document<any, any, MangaSchema> | null> {
  let query = {
    tags: {
      $in: includedTags,
      $nin: excludedTags
    }
  };
  const count = await Manga.countDocuments(query);
  if (count === 0 || count === null) {
    return null;
  }
  const random = Math.floor(Math.random() * count);
  const result = await Manga.findOne(query).skip(random);
  if (!result) {
    throw new Error("Could not get random doujin locally");
  }
  return result;
}