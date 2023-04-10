import chooseSource from './choose-sources.js'
import Doujin, {LightDoujin} from './doujin.js'
import { CookieJar } from 'tough-cookie'
import { IncomingHttpHeaders } from 'http'

export interface searchResult {
	results: LightDoujin[],
	total: number
}

export abstract class Source {
	baseUrl: string
	cookieJar: CookieJar
	headers: IncomingHttpHeaders

	protected constructor(
		baseUrl: string,
		cookieJar: CookieJar,
		headers: IncomingHttpHeaders
	) {
		this.baseUrl = baseUrl
		this.cookieJar = cookieJar
		this.headers = headers
	}

  abstract doujin: (id: string) => Promise<Doujin>;
  abstract random: () => Promise<Doujin>;
  abstract search: (query: string, page?: number) => Promise<searchResult>;
}

export class NotFoundError extends Error {
	constructor(message?: string) {
		super(message)
	}
}

export default class HentaiAPI {
	private declare source: Source

	constructor(source?: string) {
		this.source = chooseSource(source)
	}

	async doujin(id: string): Promise<Doujin> {
		return this.source.doujin(id)
	}

	async random(): Promise<Doujin> {
		return this.source.random()
	}

	async search(query: string, page?: number): Promise<searchResult> {
		return this.source.search(query, page)
	}
}
