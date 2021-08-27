import Verror from 'verror'

import nhentai, { Doujin }    from '../lib/nhentai'
import TelegraphUploadByUrls  from '../lib/telegraph.js'

import MangaModel,  { Manga } from '../models/manga.model.js'
import { UserSchema }         from '../models/user.model'
import getRandomMangaLocally  from '../db/get_manga_random_locally'

export default async function saveAndGetManga(user: UserSchema, id?: number): Promise<Manga> {
  let savedManga: Manga | null = null
  let newManga: Doujin | null = null
  let images: string[] = []

  if (!id) {  // RANDOM NEW MANGA
    if (user.random_localy) { // (if randomizing only in database records)
      try {
        savedManga = await getRandomMangaLocally(
          user.default_random_tags,
          user.ignored_random_tags
        )
      } catch (error) {
        throw new Verror(error, 'Getting doujin locally')
      }
      if (savedManga === null) {
        throw new Verror('Couldn\'t find manga with such tags')
      }
    } else { // (not locally)
      try {
        newManga = await nhentai.getRandomDoujin()
        images = newManga.pages
      } catch (error) {
        throw new Verror(error, 'Getting random doujin from nhentai')
      }
      let sameMangaInDB: Manga | null = null
      try {
        sameMangaInDB = await MangaModel.findOne({ id: newManga.id })
      } catch (error) {
        console.log(error)
      }
      if (sameMangaInDB) {
        savedManga = sameMangaInDB
      } else {
        try {
          savedManga = await saveNewManga(newManga)
        } catch (error) {
          throw new Verror(error, 'Saving doujin')
        }
      }
      console.log('Got manga random locally!')
    }
  } else {
    try {
      savedManga = await MangaModel.findOne({ id: id })
    } catch (error) {
      console.log(error)
    }
    if (!savedManga) {
      try {
        newManga = await nhentai.getDoujin(id)
      } catch (error) {
        if(error.message === 'Not found'){
          throw new Error('Not found')
        }
        throw new Verror(error, 'Getting doujin by id')
      }
      images = newManga.pages
      savedManga = await saveNewManga(newManga)
    }
    console.log('Got manga by id')
  }

  // Update old manga where telegraph_url was not saved for some reason
  if (!savedManga.telegraph_url) {
    await updateTelegraphUrl(images, savedManga)
  }
  // Add thumbnail and first page if was saved without them
  if (!savedManga.thumbnail || !savedManga.page0) {
    await addThumbnail(savedManga)
  }
  // Update old manga where date was not specified
  if (!savedManga.createdAt || !savedManga.updatedAt) {
    await MangaModel.updateOne(
      { id: savedManga.id },
      {
        $set:
          {
            createdAt: new Date(),
            updatedAt: new Date()
          },
      }
    )
    console.log('Added date to ' + savedManga.id)
  }
  console.log('returning manga')
  return savedManga
}

async function saveNewManga(manga: Doujin): Promise<Manga> {
  const thumbnail = Array.isArray(manga.thumbnails) && manga.thumbnails[0]
    ? manga.thumbnails[0]
    : undefined
  const page0 = manga.pages[0]
  const language = manga.details.languages
    ? manga.details.languages[manga.details.languages.length - 1]
    : undefined

  let telegraphUrl: string | undefined
  try {
    telegraphUrl = await TelegraphUploadByUrls(manga)
  } catch (error) {
    throw new Verror(error, 'Posting doujin to telegra.ph')
  }

  const mangaDB = new MangaModel({
    id:            manga.id,
    title:         manga.title,
    description:   language,
    tags:          manga.details.tags,
    telegraph_url: telegraphUrl,
    pages:         manga.details.pages,
    thumbnail,
    page0,
  })
  try {
    await mangaDB.save()
  } catch (error) {
    console.log('Could not save new manga :(')
    console.log(error)
  }
  console.log('Doujin saved')
  return mangaDB
}

async function updateTelegraphUrl(images: string[], savedManga: Manga) {
  if (images.length === 0) {
    let mangaWithPages: Doujin | undefined
    try {
      mangaWithPages = await nhentai.getDoujin(savedManga.id)
    } catch (error) {
      if(error.message === 'Not found'){
        throw new Error('Not found')
      }
      throw new Verror(error, 'Getting images to update manga without telegra.ph url')
    }
    images = mangaWithPages.pages
    console.log('Got pages to fix manga from DB')
  }
  try {
    savedManga.telegraph_url = await TelegraphUploadByUrls(savedManga, images)
  } catch (error) {
    throw new Verror(error, 'Posting doujin to telegra.ph to fix manga without telegra.pf url')
  }
  try {
    await savedManga.save()
  } catch (error) {
    console.log('Could not save manga with updated telegraph_url: ' + savedManga.id)
    console.log(error)
  }
}

async function addThumbnail(savedManga: Manga) {
  let mangaWithThumbnail: Doujin | undefined
  try {
    mangaWithThumbnail = await nhentai.getDoujin(savedManga.id)
  } catch (error) {
    if(error.message === 'Not found'){
      throw new Error('Not found')
    }
    throw new Verror('Getting manga with thumbnail')
  }
  savedManga.thumbnail = mangaWithThumbnail.thumbnails[0]
  savedManga.page0 = mangaWithThumbnail.pages[0]

  try {
    await savedManga.save()
  } catch (error) {
    console.log('Could not save manga with updated thumbnail and page0: ' + savedManga.id)
    console.log(error)
  }
  console.log('Added thumbnail and page0 to ' + savedManga.id)
}