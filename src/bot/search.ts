import { Composer } from 'grammy'
import getDoujin from '../lib/get-doujin.js'
import Werror from '../lib/error.js'
import HentaiAPI, { NotFoundError } from '../sources/index.js'
import { InlineQueryResult } from 'grammy/types'
import config from '../../config.js'

const composer = new Composer()

composer.on('inline_query', async (ctx) => {
	const id = parseInt(ctx.inlineQuery.query, 10)
	if (Number.isNaN(id) && ctx.inlineQuery.query.length < 3) {
		return ctx.answerInlineQuery([])
	}

	if (!Number.isNaN(id)) {
		let result: InlineQueryResult | undefined

		let doujin
		try {
			doujin = await getDoujin(String(id))
		} catch (err) {
			if (err instanceof Werror && err.cause instanceof NotFoundError) {
				result = {
					id: '6969696969',
					type: 'article',
					title: 'Not found',
					description: 'Not found',
					thumbnail_url: config.help_icon_inline,
					input_message_content: {
						message_text: 'Not found',
					},
				}

				return ctx.answerInlineQuery([result])
			}

			throw new Werror(err, 'Error getting doujin with id: ' + id)
		}

		result = {
			id: doujin.id.split('_')[1],
			type: 'article',
			title: doujin.title,
			description: doujin.description,
			thumbnail_url: doujin.thumbnail,
			input_message_content: {
				message_text: doujin.description,
				parse_mode: 'HTML',
			},
		}

		return ctx.answerInlineQuery([result])
	}

	const page = ctx.inlineQuery.query.match(/\/p(\d+)/)?.[1] ?? '1'

	const hentaiAPI = new HentaiAPI()
	const searchResult = await hentaiAPI.search(ctx.inlineQuery.query, parseInt(page, 10))

	const results: InlineQueryResult[] = []

	for (const doujin of searchResult.results) {
		const previewURL = new URL('https://t.me/iv?rhash=cadd02903410b2')
		previewURL.searchParams.set('url', doujin.url)
		let message = `<a href="${previewURL.toString()}">${doujin.caption[0]}</a>`
		message += `<a href="${doujin.url}">${doujin.caption.slice(1)}</a>`

		results.push({
			id: doujin.id,
			type: 'article',
			title: doujin.caption,
			description: doujin.caption,
			thumbnail_url: doujin.thumbnail,
			input_message_content: {
				message_text: message,
				parse_mode: 'HTML',
			},
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Load info',
							callback_data: 'open_' + doujin.id,
						},
						{
							text: 'Preview',
							url: previewURL.toString(),
						}
					],
				],
			}
		})
	}

	return ctx.answerInlineQuery(results)
})

export default composer
