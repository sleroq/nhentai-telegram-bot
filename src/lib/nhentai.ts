import got, { Response } from 'got'
import cheerio, { CheerioAPI } from 'cheerio'
import { Element } from 'cheerio'

export interface Doujin {
	id: number
	url: string
	title: {
		translated: {
			before?: string
			pretty: string
			after?: string
		}
		original: {
			before?: string
			pretty: string
			after?: string
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
			pretty?: string
		}
	}
	pages: string[]
	thumbnails: string[]
}

export interface Tag {
	id: number
	type?: 'character' | 'language' | 'tag' | 'group' | 'parody' | 'category' | 'artist'
	name: string
	url?: string
	count: number
}

export interface Homepage {
	popular: LightDoujin[]
	new: LightDoujin[]
}
export interface SearchResult<T> {
	results: T[]
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

export interface ApiSearchResponse {
	result: ApiSearchResult[]
	num_pages: number
	per_page: number
}

export interface ApiSearchResult {
	id: string
	media_id: string
	title: {
		english: string | null
		japanese: string | null
		pretty: string | null
	}
	images: {
		pages: ApiPage[]
		cover: ApiPage
		thumbnail: ApiPage
	}
	scanlator: string
	upload_date: number
	tags: Tag[]
	num_pages: number
	num_favorites: number
}

export interface ApiPage {
	t: 'j' | 'p' | 'g'
	w: number
	h: number
}

export default class nHentai {
	static async getDoujin(identifier: string | number): Promise<Doujin> {
		if (!identifier) {
			throw Error('You have to specify id')
		}
		let response: Response<string> | undefined
		try {
			response = await got(`https://nhentai.net/g/${identifier}/`)
		} catch (error) {
			const e = getError(error)

			if (e.message === 'Response code 404 (Not Found)') {
				throw new Error('Not found')
			}
			throw e
		}
		return assembleDoujin(response)
	}
	static async getRandomDoujin(): Promise<Doujin> {
		let response: Response<string> | undefined
		try {
			response = await got('https://nhentai.net/random/')
		} catch (error) {
			const e = getError(error)

			if (e.message === 'Response code 404 (Not Found)') {
				throw new Error('Not found')
			}
			throw e
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
	// Fast, but not reliable search
	static async searchApi(query: string, page = 1, sort: SortingType = ''): Promise<SearchResult<Doujin>> {
		if (!query) {
			throw Error('No search query')
		}
		if (sort !== 'popular'
			&& sort !== 'popular-today'
			&& sort !== 'popular-week'
			&& sort !== '') {
			throw Error('Wrong sorting')
		}

		const response = await got('https://nhentai.net/api/galleries/search', {
			searchParams: { query, page, sort }
		})

		const body: ApiSearchResponse = JSON.parse(response.body)

		const searchResult: SearchResult<Doujin> = {
			results:            [],
			totalSearchResults: body.num_pages * body.per_page,
			lastPage:           body.num_pages,
		}

		body.result.map((result) => {
			const tags = result.tags.filter((tag) => tag.type === 'tag')
			const parodies = result.tags.filter((tag) => tag.type === 'parody')
			const characters = result.tags.filter((tag) => tag.type === 'character')
			const artists = result.tags.filter((tag) => tag.type === 'artist')
			const groups = result.tags.filter((tag) => tag.type === 'group')
			const categories = result.tags.filter((tag) => tag.type === 'category')
			const languages = result.tags.filter((tag) => tag.type === 'language')

			const pages: string[] = []
			result.images.pages.forEach((page, index) => {
				pages.push(`https://i.nhentai.net//galleries/${result.media_id}/${index + 1}.${extention[page.t]}`)
			})
			const thumbnails: string[] = []
			result.images.pages.forEach((page, index) => {
				thumbnails.push(`https://t.nhentai.net/galleries/${result.media_id}/${index + 1}t.${extention[page.t]}`)
			})

			searchResult.results.push({
				id:    Number(result.id),
				url:   `https://nhentai.net/g/${result.id}/`,
				title: {
					translated: {
						pretty: result.title.pretty || result.title.english || ''
					},
					original: {
						pretty: result.title.japanese || ''
					}
				},
				details: {
					parodies:   parodies || undefined,
					characters: characters || undefined,
					artists:    artists || undefined,
					groups:     groups || undefined,
					categories: categories || undefined,
					pages:      result.num_pages,
					languages,
					tags,
					uploaded:   {
						datetime: new Date(result.upload_date)
					}
				},
				pages,
				thumbnails
			})
		})
		return searchResult
	}

	static async search(query: string, page = 1, sort: SortingType = ''): Promise<SearchResult<LightDoujin>> {
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
				.replace(/,/g, '')
				.replace(/\sresults/g, '')
		)
		const pagination = $('#content .pagination')
		const lastPageMatch = pagination.children('.last').attr('href')?.match(/page=([0-9]+)/)
		const lastPage = Number(
			lastPageMatch ? lastPageMatch[1] : undefined
		)
		const searchResult: SearchResult<LightDoujin> = {
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
			const e = getError(error)

			if (e.message === 'Response code 404 (Not Found)') {
				return false
			}
		}
		return true
	}
}
const extention = {
	j: 'jpg',
	p: 'png',
	g: 'gif'
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
			after: 	translated.children('.after').text(),
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
				count: Number($(element).children('.count').text()),
				id:    Number($(element).attr('class')?.split(/tag\stag-/g)[1])
			})
		})
		if (tags.length !== 0) {
			return tags
		}
		return undefined
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
		if (thumbnailUrl) {
			const complete = thumbnailUrl
				.replace(/(\/[0-9]+)t./, '$1.')
				.replace(/(https:\/\/)t./, '$1i.')
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

function getError(error: unknown) {
	if (error instanceof Error) {
		return error
	} else {
		throw new Error('Error is not an instance of Error: ' + error)
	}
}