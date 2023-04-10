import { Composer } from 'grammy'
import getDoujin from '../../lib/get-doujin.js'

const composer = new Composer()

composer.callbackQuery(/open_.+/gm, async ctx => {
	const id = ctx.callbackQuery.data.split('_')[1]
	if (!id) return

	const doujin = await getDoujin(id)
	await ctx.editMessageText(doujin.description, {
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: 'Search',
						switch_inline_query_current_chat: '',
					},
				],
			]
		}
	})
})

export default composer