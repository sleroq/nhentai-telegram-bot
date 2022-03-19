import Werror from './error'

import config            from '../../config'
import got, { Response } from 'got'

import { Doujin }      from './nhentai'
import { Manga }       from '../models/manga.model'
import { getTitle }    from './some_functions'

const token = process.env.TELEGRAPH_TOKEN

interface Page {
	path: string
	url: string
	title: string
	description: string
	author_name?: string
	author_url?: string
	image_url?: string
	content?: Array<Node>
	views: number
	can_edit?: boolean
}

interface NodeElement {
	tag: 'a' | 'aside' | 'b' | 'blockquote' | 'br' | 'code' | 'em' | 'figcaption' | 'figure' | 'h3' | 'h4' | 'hr' | 'i' | 'iframe' | 'img' | 'li' | 'ol' | 'p' | 'pre' | 's' | 'strong' | 'u' | 'ul' | 'video'
	attrs?: {
		href?: string
		src?: string
	}
	children?: Array<Node> | string
}

type Node = string | NodeElement

export async function telegraphCreatePage(
	manga: Doujin | Manga,
	images: string[],
	username = config.bot_username
): Promise<Page> {
	const title = getTitle(manga)
	const htmlImages: Node[] = images.map((image) => ({
		tag:   'img',
		attrs: { src: `${image}` },
	}))

	const content: Node[] = []
	content.push(...htmlImages)

	let contentString
	try {
		contentString = JSON.stringify(content)
	} catch (error) {
		throw new Werror(error, 'Stringifying content')
	}

	let response: Response<string>

	try {
		response = await got('https://api.telegra.ph/createPage', {
			searchParams: {
				access_token: token,
				title: title,
				author_name: '@' + username,
				content: contentString,
				return_content: true
			}
		})
	} catch (error) {
		throw new Werror(error, 'Making request')
	}

	let parsedResponse
	try {
		parsedResponse = JSON.parse(response.body)
	} catch (error) {
		throw new Werror(error, 'Parsing json response from telegra.ph')
	}

	if (!parsedResponse.ok) throw new Werror('Result is not ok: ' + parsedResponse.error)
	if (!parsedResponse.result) throw new Werror('No result in response')

	return parsedResponse.result
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