
import Werror from './error'

import Telegraph         from 'telegra.ph'
import config            from '../../config'
import got, { Response } from 'got'

import { Doujin }      from './nhentai'
import { Node, Page}   from 'telegra.ph/typings/telegraph'
import { Manga }       from '../models/manga.model'
import { getTitle }    from './some_functions'

const token = process.env.TELEGRAPH_TOKEN

let client: undefined | Telegraph

function getClient(): Telegraph {
	if (!token) {
		throw new Error('No telegraph token')
	}
	if (!client) {
		client = new Telegraph(token)
	}
	return client
}

export async function telegraphCreatePage(
	manga: Doujin | Manga,
	images: string[],
	username = config.bot_username
): Promise<Page> {
	const client = await getClient()
	const page: Node[] = []
	const title = getTitle(manga)
	return client.createPage(
		`${title}`,
		page
			.concat(
				images.map((image) => ({
					tag:   'img',
					attrs: { src: `${image}` },
				}))
			)
			.concat([
				{
					tag:      'a',
					children: [config.text_at_the_end_of_telegraph_page],
				},
			]),
		'@' + username,
		'https://t.me/' + username,
		true
	)
}

export default async function TelegraphUploadByUrls(
	manga: Doujin | Manga,
	images?: string[]
): Promise<string> {
	const pages = images || manga.pages

	if (typeof pages === 'number') {
		throw new Error('You have to provide pages, or Doujin with them')
	}

	const articlePage = await telegraphCreatePage(manga, pages)

	if (!articlePage || !articlePage.url) {
		throw new Error('Could not create a page: no page url')
	}
	return articlePage.url
}
interface AccountResponse {
	ok: true,
	result: {
		short_name:   string,
		author_name:  string,
		author_url:   string,
		access_token: string,
		auth_url:     string
	}
}
export async function createAccount(): Promise<string> {
	let response: Response<AccountResponse> | undefined
	try {
		response = await got({
			url:          `https://api.telegra.ph/createAccount?short_name=${config.bot_username}&author_name=${config.bot_username}`,
			responseType: 'json',
		})
	} catch (error) {
		throw new Werror(error, 'Creating telegra.ph account')
	}
	if (!response.body.ok || !response.body.result || !response.body.result.access_token) {
		throw new Werror('Response is not ok, respose: ' + response.body)
	}
	console.log('Your telegra.ph access token: \'' + response.body.result.access_token + '\'')
	return response.body.result.access_token
}