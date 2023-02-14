import chooseSource from './choose-sources.js'
import Doujin from './doujin.js'
import { User } from '../models/user.model.js'
import { CookieJar } from 'tough-cookie'
import { IncomingHttpHeaders } from 'http'

// import eHentaiVip from './ehentai.vip'
// import nHentai from "./nhentai.js"

export abstract class Source {
	baseUrl: string
	cookieJar: CookieJar
	headers: IncomingHttpHeaders

	constructor(baseUrl: string, cookieJar: CookieJar, headers: IncomingHttpHeaders) {
		this.baseUrl = baseUrl
		this.cookieJar = cookieJar
		this.headers = headers
	}

  abstract doujin: (id: string) => Promise<Doujin>
  abstract randomDoujin: (id: string) => Promise<Doujin>
}

export default class hentaiAPI {
	declare private source: Source

	constructor(user: User) {
		this.source = chooseSource(user)
	}

	async doujin(id: string): Promise<Doujin> {
		return await this.source.doujin(id)
	}

	async randomDoujin(id: string): Promise<Doujin> {
		return await this.source.randomDoujin(id)
	}
}
