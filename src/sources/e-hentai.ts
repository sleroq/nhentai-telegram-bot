import got, { Response } from 'got'
import { IncomingHttpHeaders } from 'http'
import Doujin from './doujin.js'
import { CookieJar } from 'tough-cookie'
import { Source } from './index.js'
import Werror from '../lib/error.js'

interface eHentaiApiError {
  error: string;
  gid: string;
}

interface Gmetadata {
  gid: number;
  token: string;
  title: string;
  title_jpn: string;
  category: string;
  thumb: string;
  posted: string;
  filecount: string;
  filesize: number;
  expunged: boolean;
  rating: string;
  torrentcount: string;
  tags: string[];
  archiver_key: string;
  torrents: {
    hath: string;
    added: number;
    name: string;
    tsize: number;
    fsize: number;
  }[];
}

type eHentaiApiResponse = eHentaiApiError | Gmetadata;

export function getAPIUrl(baseURL: string): string {
	const url = new URL(baseURL)
	url.pathname = '/api.php'
	url.host = 'api' + '.' + url.host
	return url.toString()
}

export default class nHentai implements Source {
	baseUrl: string
	baseAPIUrl: string
	cookieJar: CookieJar
	headers: IncomingHttpHeaders

	constructor(
		baseUrl?: string,
		cookieJar?: CookieJar,
		headers?: IncomingHttpHeaders
	) {
		this.baseUrl = baseUrl || 'https://e-hentai.org'
		this.baseAPIUrl = getAPIUrl(this.baseUrl)
		this.cookieJar = cookieJar || new CookieJar()
		this.headers = headers || {}
	}

	// Id format is {gallery_id}-{gallery_token}
	async doujin(identifier: string): Promise<Doujin> {
		const [gid, gt] = identifier.split('-')

		let response: Response<eHentaiApiResponse>
		try {
			response = await got(this.baseAPIUrl, {
				method: 'POST',
				json: {
					method: 'gdata',
					gidlist: [[gid, gt]],
					// namespace: 1
				},
				responseType: 'json',
			})
		} catch (error) {
			throw new Werror(error, 'Making request')
		}

		if ('error' in response.body) {
			// TODO: Handle 404 and similar errors
			throw new Werror(response.body.error, 'Getting doujin')
		}

		const meta: Gmetadata = response.body
		console.log(meta)

		let res2: Response<eHentaiApiResponse>
		try {
			res2 = await got(this.baseAPIUrl, {
				method: 'POST',
				json: {
					method: 'showpage',
					gidlist: [[gid, gt, 1]],
				},
				responseType: 'json',
			})
		} catch (error) {
			throw new Werror(error, 'Making request')
		}
		console.log(res2.body)

		// let response: Response<string>
		// try {
		// 	response = await got(this.baseUrl + '/g/' + gid + '/' + gt)
		// } catch (error) {
		// 	throw new Werror(error, 'Making request')
		// }
		//
		// const $ = cheerio.load(response.body)
		// console.log($.html())

		throw new Error('Not implemented')
	}
	async randomDoujin(): Promise<Doujin> {
		throw new Error('Not implemented')
	}
}
//
// function makeDoujinFromMeta(meta: Gmetadata): Doujin {
// 	return {
// 		id: meta.gid + '-' + meta.token,
// 		title: {
// 			translated: {
// 				full: meta.title,
// 				pretty: meta.title
// 			},
// 			original: {
// 				full: meta.title_jpn || meta.title,
// 				pretty: meta.title_jpn || meta.title,
// 			}
// 		},
// 		originalTitle: meta.title_jpn,
// 		cover: meta.thumb,
// 		uploadDate: new Date(meta.posted * 1000),
// 		tags: meta.tags,
// 		pages: meta.filecount,
// 	}
// }

// function getError(error: unknown): Error {
// 	if (error instanceof Error) {
// 		return error
// 	} else {
// 		throw new Error('Error is not an instance of Error: ' + error)
// 	}
// }
