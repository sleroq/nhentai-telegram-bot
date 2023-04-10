import getDoujin from '../../lib/get-doujin.js'
import Werror from '../../lib/error.js'
import { NotFoundError } from '../../sources/index.js'
import { Context } from 'grammy'
import { pino } from 'pino'

export default async function handleIDs<T extends Context>(
	ids: string[],
	ctx: T,
	logger: pino.Logger
) {
	for (const id of ids) {
		let doujin
		try {
			doujin = await getDoujin(id)
		} catch (err) {
			if (err instanceof Werror && err.cause instanceof NotFoundError) {
				await ctx.reply(`doujin <code>${id}</code> is not found`, {
					parse_mode: 'HTML',
				})
			}

			logger.error(err, 'Error getting doujin with id: ' + id)
			await ctx.reply('Error getting doujin <code>' + id + '</code>', {
				parse_mode: 'HTML',
			})

			return
		}

		await ctx.reply(doujin.description, {
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
	}
}
