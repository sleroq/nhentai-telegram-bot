import got, { Response } from 'got'
import cheerio, { CheerioAPI } from 'cheerio'
import { Element } from 'cheerio'
export interface Doujin {
  id: number
  url: string
  title: {
    translated: {
      before: string
      pretty: string
      after: string
    }
    original: {
      before: string
      pretty: string
      after: string
    }
  }
  details: {
    parodies?: Tag[]
    characters?: Tag[]
    tags?: Tag[]
    artists?: Tag[]
    groups?: Tag[]
    languages?: Tag[]
    categories?: Tag[]
    pages: number
    uploaded: {
      datetime?: Date
      pretty: string
    }
  }
  pages: string[]
  thumbnails: string[]
}

export interface Tag {
  name: string,
  count: string,
  id: number
}

export interface Homepage {
  popular: LightDoujin[]
  new: LightDoujin[]
}
export interface SearchResult {
  results: LightDoujin[]
  lastPage: number
  totalSearchResults: number
}
export interface LightDoujin {
  id?: number
  url?: string
  thumbnail?: string
  title?: string
  language: Language | undefined
  tags?: number[]
}
export type Language = 'english' | 'japanese' | 'chinese'
export type SortingType = 'popular' | 'popular-today' | 'popular-week' | ''

export default class nHentai {
  static async getDoujin(identifier: string | number): Promise<Doujin> {
    if (!identifier) {
      throw Error('You have to specify id')
    }
    let response: Response<string> | undefined 
    try {
      response = await got(`https://nhentai.net/g/${identifier}/`)
    } catch (error) {
      if (error.message === 'Response code 404 (Not Found)') {
        throw new Error('Not found')
      }
      throw error
    }
    return assembleDoujin(response)
  }
  static async getRandomDoujin(): Promise<Doujin> {
    let response: Response<string> | undefined 
    try {
      response = await got('https://nhentai.net/random/')
    } catch (error) {
      if (error.message === 'Response code 404 (Not Found)') {
        throw new Error('Not found')
      }
      throw error
    }

    return assembleDoujin(response)
  }

  static async getHomepage(page = 1): Promise<Homepage> {
    const response = await got('https://nhentai.net/?page=' + page)

    const $ = cheerio.load(response.body)

    const homepage: Homepage = {
      popular: [],
      new:     [],
    }
    const popularContainer = $('.container.index-container.index-popular')
    const newContainer = $('.container.index-container:contains(New)')

    popularContainer.children('.gallery').each((index, element) => {
      const doujin = getLightDoujin($, element)
      homepage.popular.push(doujin)
    })
    newContainer.children('.gallery').each((index, element) => {
      const doujin = getLightDoujin($, element)
      homepage.new.push(doujin)
    })
    return homepage
  }

  static async search(query: string, page = 1, sort: SortingType = ''): Promise<SearchResult> {
    if (!query) {
      throw Error('No search query')
    }
    if (sort !== 'popular'
      && sort !== 'popular-today'
      && sort !== 'popular-week'
      && sort !== '') {
      throw Error('Wrong sorting')
    }
    const response = await got('https://nhentai.net/search/', {
      searchParams: {
        q: query,
        page,
        sort
      }
    })

    const $ = cheerio.load(response.body)

    const numberOfResults = Number(
      $('#content h1').text()
        .replace(',', '')
        .replace(' results', '')
    )
    const pagination = $('#content .pagination')
    const lastPageMatch = pagination.children('.last').attr('href')?.match(/page=([0-9]+)/)
    const lastPage = Number(
      lastPageMatch ? lastPageMatch[1] : undefined
    )
    const searchResult: SearchResult = {
      results:            [],
      totalSearchResults: numberOfResults,
      lastPage:           lastPage,
    }
    $('.container.index-container .gallery').each((index, element) => {
      const doujin = getLightDoujin($, element)
      searchResult.results.push(doujin)
    })
    return searchResult
  }

  static async exists(identifier: string | number): Promise<boolean> {
    if (!identifier) {
      throw Error('You have to specify id')
    }
    try {
      await got('https://nhentai.net/g/' + identifier + '/')
    } catch (error) {
      if (error.message === 'Response code 404 (Not Found)') {
        return false
      }
    }
    return true
  }
}
export function getIdFromUrl(url: string | number): number {
  const numberRegexp = /\/g\/(\d+)\/?.*/
  const matchNumbers = String(url).match(numberRegexp)
  if (!matchNumbers
    || !matchNumbers[1]
    || Number.isNaN(Number(matchNumbers[1]))) {
    console.error('No id in this url ' + url)
    throw new Error('No id in this url')
  }
  return Number(matchNumbers[1])
}
function getLightDoujin($: CheerioAPI, element: Element) {
  const cover = $(element).children('.cover')
  const relativeUrl = cover.attr('href')
  const absoluteUrl = relativeUrl
    ? new URL(relativeUrl, 'https://nhentai.net').toString()
    : undefined
  const matchId = relativeUrl?.match(/[0-9]+/g)
  const tags = $(element).attr('data-tags')?.split(' ').map((element) => Number(element))
  const thumbnail = cover.children('img').attr('data-src')
  let language: Language | undefined
  if (tags) {
    if (tags.includes(6346)) {
      language = 'japanese'
    } else if (tags.includes(29963)) {
      language = 'chinese'
    } else if (tags.includes(12227)) {
      language = 'english'
    }
  }
  return {
    id:    matchId ? Number(matchId[0]) : undefined,
    url:   absoluteUrl,
    thumbnail,
    title: cover.children('.caption').text(),
    language,
    tags
  }
}
function assembleDoujin(response: Response<string>): Doujin {
  const url = response.redirectUrls[response.redirectUrls.length - 1] || response.url
  const id = getIdFromUrl(url)
  const $ = cheerio.load(response.body)
  const doujinInfo = $('#info')

  const translated = doujinInfo.children('.title').first()
  const original = doujinInfo.children('.title').last()

  const title = {
    translated: {
      before: translated.children('.before').text(),
      pretty: translated.children('.pretty').text(),
      after:  translated.children('.after').text(),
    },
    original: {
      before: original.children('.before').text(),
      pretty: original.children('.pretty').text(),
      after:  original.children('.after').text(),
    }
  }

  const tagsElement = doujinInfo.children('#tags')
  function getTag(title: string): Tag[] | undefined {
    const tagsContainer = tagsElement.children(`.tag-container:contains(${title})`).children('.tags')
    const tags: Tag[] = []
    tagsContainer.children('a').each((index, element) => {
      tags.push({
        name:  $(element).children('.name').text(),
        count: $(element).children('.count').text(),
        id:    Number($(element).attr('class')?.split(/tag\stag-/g)[1])
      })
    })
    if (tags.length !== 0) {
      return tags
    }
    return
  }
  function getUploaded(title: string): Doujin['details']['uploaded'] {
    const tagsContainer = tagsElement.children(`.tag-container:contains(${title})`).children('.tags')
    const datetimeElement = tagsContainer.children('time').attr('datetime')
    const datetime = datetimeElement ? new Date(datetimeElement) : undefined
    return {
      datetime: datetime,
      pretty:   tagsContainer.children('time').text(),
    }
  }

  const thumbnails: Doujin['thumbnails'] = []
  const pages: Doujin['pages'] = []

  $('.thumb-container').each((index, element) => {
    const thumbnailElement = $(element).children('a')
    const thumbnailUrl = thumbnailElement.children('img').attr('data-src')
    if (thumbnailUrl) {
      thumbnails.push(thumbnailUrl)
    }
    const relativeImageUrl = thumbnailElement.attr('href')
    if (relativeImageUrl && thumbnailUrl) {
      const absolute = new URL(relativeImageUrl, 'https://i.nhentai.net/galleries/').toString().replace(/\/$/, '')
      const complete = absolute + thumbnailUrl.slice(thumbnailUrl.lastIndexOf('.'))
      pages.push(complete)
    }
  })

  const details = {
    parodies:   getTag('Parodies:'),
    characters: getTag('Characters:'),
    tags:       getTag('Tags:'),
    artists:    getTag('Artists:'),
    groups:     getTag('Groups:'),
    languages:  getTag('Languages:'),
    categories: getTag('Categories:'),
    pages:      pages.length,
    uploaded:   getUploaded('Uploaded:')
  }

  return {
    id,
    url,
    title,
    details,
    thumbnails,
    pages,
  }
}