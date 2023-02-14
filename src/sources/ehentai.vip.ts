import got, { Response } from 'got'
import * as cheerio from 'cheerio'

import Doujin, { Tag } from './doujin'

export default class eHentaiVip {
	static async getDoujin(identifier: string | number): Promise<Doujin> {
		if (!identifier) {
			throw Error('You have to specify id')
		}
		let response: Response<string> | undefined
		try {
			response = await got(`https://ehentai.vip/g/${identifier}/`)
		} catch (error) {
			const e = getError(error)

			if (e.message === 'Response code 404 (Not Found)') {
				throw new Error('Not found')
			}
			throw e
		}

		console.log(response.body)

		return assembleDoujin(response)
	}

	static async getRandomDoujin(): Promise<Doujin> {
		let response: Response<string> | undefined
		try {
			response = await got('https://ehentai.vip/random/')
		} catch (error) {
			const e = getError(error)

			if (e.message === 'Response code 404 (Not Found)') {
				throw new Error('Not found')
			}
			throw e
		}

		return assembleDoujin(response)
	}


	// // Fast, but not reliable search
	// static async searchApi(query: string, page = 1, sort: SortingType = ''): Promise<SearchResult<Doujin>> {
	// 	if (!query) {
	// 		throw Error('No search query')
	// 	}
	// 	if (sort !== 'popular'
	// 		&& sort !== 'popular-today'
	// 		&& sort !== 'popular-week'
	// 		&& sort !== '') {
	// 		throw Error('Wrong sorting')
	// 	}

	// 	const response = await got('https://ehentai.vip/api/galleries/search', {
	// 		searchParams: { query, page, sort }
	// 	})

	// 	const body: ApiSearchResponse = JSON.parse(response.body)

	// 	const searchResult: SearchResult<Doujin> = {
	// 		results:            [],
	// 		totalSearchResults: body.num_pages * body.per_page,
	// 		lastPage:           body.num_pages,
	// 	}

	// 	body.result.map((result) => {
	// 		const tags = result.tags.filter((tag) => tag.type === 'tag')
	// 		const parodies = result.tags.filter((tag) => tag.type === 'parody')
	// 		const characters = result.tags.filter((tag) => tag.type === 'character')
	// 		const artists = result.tags.filter((tag) => tag.type === 'artist')
	// 		const groups = result.tags.filter((tag) => tag.type === 'group')
	// 		const categories = result.tags.filter((tag) => tag.type === 'category')
	// 		const languages = result.tags.filter((tag) => tag.type === 'language')

	// 		const pages: string[] = []
	// 		result.images.pages.forEach((page, index) => {
	// 			pages.push(`https://i.ehentai.vip//galleries/${result.media_id}/${index + 1}.${extention[page.t]}`)
	// 		})
	// 		const thumbnails: string[] = []
	// 		result.images.pages.forEach((page, index) => {
	// 			thumbnails.push(`https://t.ehentai.vip/galleries/${result.media_id}/${index + 1}t.${extention[page.t]}`)
	// 		})

	// 		searchResult.results.push({
	// 			id:    Number(result.id),
	// 			url:   `https://ehentai.vip/g/${result.id}/`,
	// 			title: {
	// 				translated: {
	// 					pretty: result.title.pretty || result.title.english || ''
	// 				},
	// 				original: {
	// 					pretty: result.title.japanese || ''
	// 				}
	// 			},
	// 			details: {
	// 				parodies:   parodies || undefined,
	// 				characters: characters || undefined,
	// 				artists:    artists || undefined,
	// 				groups:     groups || undefined,
	// 				categories: categories || undefined,
	// 				pages:      result.num_pages,
	// 				languages,
	// 				tags,
	// 				uploaded:   {
	// 					datetime: new Date(result.upload_date)
	// 				}
	// 			},
	// 			pages,
	// 			thumbnails
	// 		})
	// 	})
	// 	return searchResult
	// }

	// static async search(query: string, page = 1, sort: SortingType = ''): Promise<SearchResult<LightDoujin>> {
	// 	if (!query) {
	// 		throw Error('No search query')
	// 	}
	// 	if (sort !== 'popular'
	// 		&& sort !== 'popular-today'
	// 		&& sort !== 'popular-week'
	// 		&& sort !== '') {
	// 		throw Error('Wrong sorting')
	// 	}

	// 	const response = await got('https://ehentai.vip/search/', {
	// 		searchParams: {
	// 			q: query,
	// 			page,
	// 			sort
	// 		}
	// 	})

	// 	const $ = cheerio.load(response.body)

	// 	const numberOfResults = Number(
	// 		$('#content h1').text()
	// 			.replace(/,/g, '')
	// 			.replace(/\sresults/g, '')
	// 	)
	// 	const pagination = $('#content .pagination')
	// 	const lastPageMatch = pagination.children('.last').attr('href')?.match(/page=([0-9]+)/)
	// 	const lastPage = Number(
	// 		lastPageMatch ? lastPageMatch[1] : undefined
	// 	)
	// 	const searchResult: SearchResult<LightDoujin> = {
	// 		results:            [],
	// 		totalSearchResults: numberOfResults,
	// 		lastPage:           lastPage,
	// 	}

	// 	$('.container.index-container .gallery').each((index, element) => {
	// 		const doujin = getLightDoujin($, element)
	// 		searchResult.results.push(doujin)
	// 	})
	// 	return searchResult
	// }

	static async exists(identifier: string | number): Promise<boolean> {
		if (!identifier) {
			throw Error('You have to specify id')
		}
		try {
			await got('https://ehentai.vip/g/' + identifier + '/')
		} catch (error) {
			const e = getError(error)

			if (e.message === 'Response code 404 (Not Found)') {
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
			after: translated.children('.after').text(),
		},
		original: {
			before: original.children('.before').text(),
			pretty: original.children('.pretty').text(),
			after: original.children('.after').text(),
		}
	}

	const tagsElement = doujinInfo.children('#tags')
	function getTag(title: string): Tag[] | undefined {
		const tagsContainer = tagsElement.children(`.tag-container:contains(${title})`).children('.tags')
		const tags: Tag[] = []
		tagsContainer.children('a').each((index, element) => {
			tags.push({
				name: $(element).children('.name').text(),
				count: Number($(element).children('.count').text()),
				id: Number($(element).attr('class')?.split(/tag\stag-/g)[1])
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
			pretty: tagsContainer.children('time').text(),
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
				.replace(/(\/[0-9]+)t\./, '$1.')
				.replace(/(https:\/\/)t/, '$1i')

			pages.push(complete)
		}
	})

	const details = {
		parodies: getTag('Parodies:'),
		characters: getTag('Characters:'),
		tags: getTag('Tags:'),
		artists: getTag('Artists:'),
		groups: getTag('Groups:'),
		languages: getTag('Languages:'),
		categories: getTag('Categories:'),
		pages: pages.length,
		uploaded: getUploaded('Uploaded:')
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

function getError(error: unknown): Error {
	if (error instanceof Error) {
		return error
	} else {
		throw new Error('Error is not an instance of Error: ' + error)
	}
}
