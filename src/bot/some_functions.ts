import { MangaSchema } from '../models/manga.model'
import { Doujin, LightDoujin } from '../nhentai'
import { Document } from 'mongoose'
import i18n from '../i18n'
import { Favorite } from '../models/user.model'

export function getMangaMessage(
  manga: Doujin | MangaSchema & Document<any, any, MangaSchema> | Favorite,
  telegraphLink?: string
): string {
  const title = getTitle(manga),
    tags = tagString(manga),
    pages_word = i18n.__('pages'),
    pages = Array.isArray(manga.pages) ? manga.pages.length : manga.pages,
    id = 'id' in manga ? manga.id : manga._id,
    mangaUrl = `https://nhentai.net/g/${id}/`
  let link: string | undefined = telegraphLink
  if (!link) {
    if ('telegraph_fixed_url' in manga && manga.telegraph_fixed_url) {
      link = manga.telegraph_fixed_url
    } else if ('telegraph_url' in manga && manga.telegraph_url) {
      link = manga.telegraph_url
    }
  }
  return `
<a href="${link}">${title}</a> (${pages} ${pages_word})
${tags}\n<a href="${mangaUrl}">nhentai.net</a> | <code>${id}</code>`
}
function tagString(
  manga: Doujin | MangaSchema & Document<any, any, MangaSchema> | Favorite
): string {
  let tags = i18n.__('tags')
  let tagsArray: string[] = []
  if ('tags' in manga && manga.tags) {
    tagsArray = manga.tags
  } else if ('details' in manga) {
    manga.details.tags?.forEach((tag) => {
      tagsArray.push(tag.name)
    })
  }
  tagsArray.forEach((tag, index) => {
    if (index !== tagsArray.length - 1) {
      tags += '#' + tag.replace(/\s/, '_').replace(/-/, '_')
    }
    if (index < tagsArray.length - 2) {
      tags += ', '
    }
  })
  return tags
}
export function sliceByHalf(s: string): string {
  let middle = Math.floor(s.length / 2)
  const before = s.lastIndexOf(' ', middle)
  const after = s.indexOf(' ', middle + 1)

  if (before == -1 || (after != -1 && middle - before >= after - middle)) {
    middle = after
  } else {
    middle = before
  }
  const s2 = s.substr(middle + 1)
  return s2
}
export function getMessageInline(manga: LightDoujin): string {
  const link = 'https://nhentai.net/g/' + manga.id + '/',
    title = manga.title ? manga.title
      .replace('<', ']')
      .replace('>', '[')
      .trim() : 'Some manga'
  return `<a href="${link}">${title}</a>`
}
export function getTitle(manga: Doujin | MangaSchema & Document<any, any, MangaSchema> | Favorite): string {
  let title
  if (typeof manga.title === 'string') {
    title = manga.title
  } else {
    if (manga.title.translated && manga.title.translated.pretty) {
      title = manga.title.translated.pretty
    } else if (manga.title.original && manga.title.original.pretty) {
      title = manga.title.original.pretty
    }
  }
  if (!title) {
    return ''
  }
  return title
    .replace(/>/g, ']')
    .replace(/</g, '[')
}
export function isFullColor(manga: Doujin | MangaSchema & Document<any, any, MangaSchema>): boolean {
  let result = false
  if ('tags' in manga && manga.tags) {
    result = manga.tags.includes('full color') || manga.tags.includes('full_color')
  } else if ('details' in manga && manga.details.tags) {
    manga.details.tags.forEach((tag) => {
      if (tag.name.includes('full color') || tag.name.includes('full_color')) {
        result = true
      }
    })
  }
  return result
}
