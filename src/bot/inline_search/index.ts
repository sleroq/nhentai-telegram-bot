import Werror from '../../lib/error'

import Context        from 'telegraf/typings/context'
import saveAndGetUser from '../../db/save_and_get_user'

import replyWithFavoritesInline from './favorites'
import replyWithHistoryInline   from './history'
import replyWithSearchInline    from './search'
import replyByIdInline          from './by_id'

export default async function (ctx: Context): Promise<void> {
	const user = await saveAndGetUser(ctx)
	if (!user || !ctx.inlineQuery) {
		return
	}
	const inlineQuery = ctx.inlineQuery.query
	const matchPage = inlineQuery.match(/\/p\d+/g)
	const specifiedPage: number | undefined = matchPage ? Number(matchPage[0].replace('/p', '')) : undefined
	const matchNumbers = inlineQuery.match(/\d+/)

	console.log(inlineQuery)
	// console.log('\'' + inlineQuery.replace(String(matchPage), '').trim() + '\'')

	// check if query is empty
	if (!inlineQuery || (matchPage && inlineQuery.replace(matchPage[0], '').trim() === '')){
		console.log('favorites')
		try  {
			await replyWithFavoritesInline(ctx, inlineQuery, specifiedPage, user)
		} catch (error) {
			throw new Werror(error, 'Inline search - favorites')
		}
	} else if (inlineQuery.startsWith('/h')) {
		console.log('history')
		try  {
			await replyWithHistoryInline(ctx, user)
		} catch (error) {
			throw new Werror(error, 'Inline search - history')
		}
	} else if(matchNumbers && inlineQuery.replace(/\d+/, '').trim() === ''){
		console.log('Inline by id')
		const doujinId = Number(matchNumbers[0])
		try  {
			await replyByIdInline(ctx, inlineQuery, user, doujinId)
		} catch (error) {
			throw new Werror(error, 'Inline search - by id')
		}
	} else {
		console.log('Inline search')
		try  {
			await replyWithSearchInline(ctx, inlineQuery, specifiedPage, user)
		} catch (error) {
			throw new Werror(error, 'Inline search - search')
		}
	}
}
