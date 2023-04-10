import {NotFoundError, searchResult, Source} from './index.js'
import { CookieJar } from 'tough-cookie'
import { IncomingHttpHeaders } from 'http'
import Doujin from './doujin.js'
import got, { HTTPError, Response } from 'got'
import Werror from '../lib/error.js'
import * as cheerio from 'cheerio'

export default class eHentai implements Source {
	baseUrl: string
	cookieJar: CookieJar
	headers: IncomingHttpHeaders

	constructor(
		baseUrl?: string,
		cookieJar?: CookieJar,
		headers?: IncomingHttpHeaders
	) {
		this.baseUrl = baseUrl || 'https://ehentai.to'
		this.cookieJar = cookieJar || new CookieJar()
		this.headers = headers || {}
	}

	async doujin(identifier: string): Promise<Doujin> {
		let response: Response<string>
		try {
			response = await got(this.baseUrl + '/g/' + identifier + '/')
		} catch (error) {
			if (error instanceof HTTPError) {
				if (error.response.statusCode === 404) {
					throw new NotFoundError()
				}
			}
			throw new Werror(error, 'Making request')
		}

		let doujin: Doujin
		try {
			doujin = this.parseDoujin(identifier, response.body)
		} catch (error) {
			throw new Werror(error, 'Parsing doujin')
		}

		return doujin
	}

	async random(): Promise<Doujin> {
		let response: Response<string>
		try {
			response = await got(this.baseUrl + '/random/')
		} catch (error) {
			if (error instanceof HTTPError) {
				if (error.response.statusCode === 404) {
					throw new NotFoundError()
				}
			}
			throw new Werror(error, 'Making request')
		}

		const id = new URL(response.url).pathname.split('/')[2]
		if (!id) {
			throw new Werror('Could not find id in url')
		}

		let doujin: Doujin
		try {
			doujin = this.parseDoujin(id, response.body)
		} catch (error) {
			throw new Werror(error, 'Parsing doujin')
		}

		return doujin
	}

	async search(query: string, page = 0): Promise<searchResult> {
		const url = new URL('/search/', this.baseUrl)
		url.searchParams.set('q', query)
		if (page > 1) {
			url.searchParams.set('page', page.toString())
		}

		let response: Response<string>
		try {
			response = await got(url.toString())
		} catch (err) {
			throw new Werror(err, 'Making search request')
		}

		let result: searchResult
		try {
			result = this.parseSearchResults(response.body)
		} catch (err) {
			throw new Werror(err, 'Parsing search results')
		}

		return result
	}

	private parseDoujin(id: string, body: string): Doujin {
		const $ = cheerio.load(body)

		const titleTranslated = $('#info h1').text()
		const titleOriginal = $('#info h2').text()
		const numberOfPages = parseInt(
			$('#info > div:contains("pages")').text().trim(),
			10
		)

		const thumbnails = $('#thumbnail-container a.gallerythumb img').map(
			(_, a) => {
				const url = a.attribs['data-src']
				if (!url) {
					throw new Werror('Could not find href in thumbnail')
				}
				return url
			}
		)
		const thumbnail = thumbnails[0]
		if (!thumbnail) {
			throw new Werror('Could not find cover thumbnail')
		}

		const pages: string[] = [...thumbnails].map((href, page) => {
			return href
				.replace(/\/\d+t\.jpg$/, `/${page + 1}.jpg`)
				.replace(/\/\d+t\.png$/, `/${page + 1}.png`)
				.replace(/\/\d+t\.gif$/, `/${page + 1}.gif`)
		})

		const details: Doujin['details'] = {
			parodies: [],
			characters: [],
			tags: [],
			artists: [],
			groups: [],
			languages: [],
			categories: [],
			pages: numberOfPages,
			uploaded: {
				datetime: new Date(),
				pretty: new Date().toLocaleString(),
			},
		}
		const tagContainers = $('#tags > .tag-container')
		for (const container of tagContainers) {
			const name = container.children.find((c) => c.type === 'text')
			if (!name || !('data' in name)) {
				throw new Werror('Could not find name in tag container')
			}

			const tags = $(container)
				.find('span.tags > a')
				.map((_, a) => {
					const el = $(a)
					const href = el.attr('href')
					if (!href) {
						throw new Werror('Could not find href in tag')
					}
					const name = el.find('span.name').text().trim()
					if (!href) {
						throw new Werror('Could not find name in tag')
					}

					return {
						name,
						url: new URL(href, this.baseUrl).toString(),
					}
				})

			switch (name.data.trim()) {
			case 'Tags':
				details.tags.push(...tags)
				break
			case 'Artists':
				details.artists.push(...tags)
				break
			case 'Groups':
				details.groups.push(...tags)
				break
			case 'Languages':
				details.languages.push(...tags)
				break
			case 'Categories':
				details.categories.push(...tags)
				break
			case 'Characters':
				details.characters.push(...tags)
				break
			case 'Parodies':
				details.parodies.push(...tags)
				break
			default:
				throw new Werror('Unknown tag container name: ' + name.data)
			}
		}

		return {
			id: id,
			title: {
				translated: {
					full: titleTranslated,
					pretty: titleTranslated,
				},
				original: {
					full: titleOriginal,
					pretty: titleOriginal,
				},
			},
			url: this.baseUrl + '/g/' + id + '/',
			details: details,
			pages,
			thumbnail,
		}
	}

	parseSearchResults(page: string): searchResult {
		const $ = cheerio.load(page)
		const total = parseInt($('body h2').text())

		const doujins = $('.container > .gallery a').map((_, a) => {
			const el = $(a)
			const href = el.attr('href')
			if (!href) {
				throw new Werror('Could not find href in doujin')
			}
			const url = new URL(href, this.baseUrl).toString()

			const id = href.replace(/^\/g\/(\d+)\/$/, '$1')

			const caption = el.find('.caption').text().trim()
			if (!caption) {
				throw new Werror('Could not find title in doujin')
			}

			const thumbnail = el.find('img').attr('data-src')
			if (!thumbnail) {
				throw new Werror('Could not find thumbnail in doujin')
			}

			return {
				id,
				url,
				caption,
				thumbnail,
			}
		})

		return {
			results: doujins.toArray(),
			total,
		}
	}
}