import { Composer } from 'grammy'
import getDoujin from '../lib/get-doujin.js'
import Werror from '../lib/error.js'
import { NotFoundError } from '../sources/index.js'
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

	return ctx.answerInlineQuery([])
})

export default composer
