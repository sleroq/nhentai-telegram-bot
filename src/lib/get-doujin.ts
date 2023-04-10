import MangaModel, { Manga, MangaI } from '../models/manga.model.js'
import Werror from './error.js'
import Doujin from '../sources/doujin.js'
import HentaiAPI from '../sources/index.js'
import { escape } from 'html-escaper'

// getDoujin function tries to find doujin in database and if it doesn't exist, it will fetch it
export default async function getDoujin(id: string) {
	const source = 'ehentai.io'
	const databaseID = `${source}_${id}`

	let doujin: Manga | null
	try {
		doujin = await MangaModel.findOne({ id: databaseID })
	} catch (err) {
		throw new Werror(err, 'Error getting doujin from database')
	}

	if (doujin) return doujin

	const hentaiAPI = new HentaiAPI()
	let fetchedDoujin: Doujin
	try {
		fetchedDoujin = await hentaiAPI.doujin(id)
	} catch (err) {
		throw new Werror(err, 'Error fetching doujin from internet')
	}

	const previewURL = new URL('https://t.me/iv?rhash=cadd02903410b2')
	previewURL.searchParams.set('url', fetchedDoujin.url)

	try {
		doujin = await saveDoujin(fetchedDoujin, databaseID, previewURL.toString())
	} catch (err) {
		throw new Werror(err, 'Error saving doujin to database')
	}

	return doujin
}

export async function saveDoujin(doujin: Doujin, databaseID: string, previewURL: string) {
	const manga = new MangaModel<MangaI>({
		id: databaseID,
		title: doujin.title.translated.pretty,
		tags: doujin.details.tags.map((tag) => tag.name),
		pages: doujin.details.pages,
		thumbnail: doujin.thumbnail,
		description: generateDescription(doujin, previewURL.toString()),
		previews: {
			telegraph_url: previewURL.toString(),
		},
	})

	try {
		await manga.save()
	} catch (err) {
		throw new Werror(err, 'Error saving doujin to database')
	}

	return manga
}

function generateDescription(doujin: Doujin, previewURL: string) {
	const { title, details, url } = doujin
	const { tags, pages, categories, characters, artists } = details

	const categoriesArray = categories.map((category) => category.name)

	let description = ''

	description += `<a href="${previewURL}">${title.translated.pretty[0]}</a>`
	description += `<a href="${url}">${escape(
		title.translated.pretty.slice(1)
	)}</a>\n`
	description += `<b>Pages:</b> ${escape(pages.toString())}\n`

	if (categoriesArray.length > 0)
		description += `<b>Categories:</b> ${escape(categoriesArray.join(', '))}\n`
	if (characters.length > 0)
		description += `<b>Characters:</b> ${escape(
			characters.map((character) => character.name).join(', ')
		)}\n`
	if (tags.length > 0)
		description += `<b>Tags:</b> #${escape(
			tags.map((tag) => tag.name.replace(' ', '_')).join(' #')
		)}\n`
	if (artists.length > 0)
		description += `<b>Artists:</b> ${escape(
			artists.map((artist) => artist.name).join(', ')
		)}\n`

	return description
}
