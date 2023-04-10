import { Composer } from 'grammy'
import HentaiAPI from '../../sources/index.js'
import Werror from '../../lib/error.js'
import { saveDoujin } from '../../lib/get-doujin.js'

const composer = new Composer()

composer.command('rand', async ctx => {
	const hentaiAPI = new HentaiAPI()

	let doujin
	try {
		doujin = await hentaiAPI.random()
	} catch (err) {
		await ctx.reply('Error getting random doujin')
		throw new Werror(err, 'Error getting random doujin')
	}

	const source = 'ehentai.io'
	const databaseID = `${source}_${doujin.id}`

	const previewURL = new URL('https://t.me/iv?rhash=cadd02903410b2')
	previewURL.searchParams.set('url', doujin.url)


	let manga
	try {
		manga = await saveDoujin(doujin, databaseID, previewURL.toString())
	} catch (err) {
		await ctx.reply('Error getting random doujin')
		throw new Werror(err, 'Error saving doujin')
	}

	await ctx.reply(manga.description, {
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: 'Search',
						switch_inline_query_current_chat: '',
					},
				],
			],
		},
	})
})

export default composer