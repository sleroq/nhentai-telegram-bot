import Verror           from 'verror'
import { Context }      from 'telegraf'
import { Update, CallbackQuery }       from 'telegraf/typings/core/types/typegram'
import makeRandom       from './commands/random'
import openInTelegraph  from './commands/open_in_telegraph'
import likeDoujin       from './commands/like'

export default async function callbackHandler(ctx: Context<Update>, callback_query: CallbackQuery.DataCallbackQuery): Promise<void> {
  const data: string = callback_query.data
  if (data === 'r'){
    try {
      await makeRandom(ctx,'next')
    } catch (error) {
      throw new Verror(error, 'Random - \'next\' button')
    }
  } else if (data === 'previous'){
    try {
      await makeRandom(ctx,'previous')
    } catch (error) {
      throw new Verror(error, 'Random - \'previous\' button')
    }
  } else if (data.match('open')) {
    try {
      await openInTelegraph(ctx, data)
    } catch (error) {
      throw new Verror(error, 'openInTelegraph')
    }
  } else if (data.match('like_')){
    try {
      await likeDoujin(ctx, callback_query)
    } catch (error) {
      throw new Verror(error, 'likeDoujin')
    }
  }
}