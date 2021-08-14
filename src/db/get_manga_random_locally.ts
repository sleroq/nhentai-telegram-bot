import Manga, { MangaSchema }    from '../models/manga.model'
import { Document, FilterQuery } from 'mongoose'

// TODO: fix ignore tags
export default async function getRandomMangaLocally(
  includedTags: string[] | undefined,
  excludedTags: string[] | undefined
): Promise<MangaSchema & Document<any, any, MangaSchema> | null> {
  let query: FilterQuery<MangaSchema> | undefined

  // const isExcluded = Array.isArray(excludedTags) && excludedTags[0]
  // const isIncluded = Array.isArray(includedTags) && includedTags[0]
  // if (isExcluded || isIncluded){
  //   query = {
  //     tags: {}
  //   }
  //   if (isIncluded){
  //     query.tags.$in = includedTags
  //   }
  //   if (isExcluded) {
  //     query.tags.$nin = excludedTags
  //   }
  // }

  const count = await Manga.countDocuments()
  if (count === 0 || count === null) {
    return null
  }
  const random = Math.floor(Math.random() * count)
  const result = await Manga.findOne(query).skip(random)
  if (!result) {
    throw new Error('Could not get random doujin locally')
  }
  return result
}