import chooseSource from './choose-sources.js'
import Doujin from './doujin.js'
import { CookieJar } from 'tough-cookie'
import { IncomingHttpHeaders } from 'http'

export abstract class Source {
	baseUrl: string
	cookieJar: CookieJar
	headers: IncomingHttpHeaders

	protected constructor(baseUrl: string, cookieJar: CookieJar, headers: IncomingHttpHeaders) {
		this.baseUrl = baseUrl
		this.cookieJar = cookieJar
		this.headers = headers
	}

  abstract doujin: (id: string) => Promise<Doujin>
  abstract randomDoujin: (id: string) => Promise<Doujin>
}

export class NotFoundError extends Error {
	constructor(message?: string) {
		super(message)
	}
}

export default class HentaiAPI {
	declare private source: Source

	constructor(source?: string) {
		this.source = chooseSource(source)
	}

	async doujin(id: string): Promise<Doujin> {
		return this.source.doujin(id)
	}

	async randomDoujin(id: string): Promise<Doujin> {
		return this.source.randomDoujin(id)
	}
}
