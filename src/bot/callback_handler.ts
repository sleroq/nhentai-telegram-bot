import Verror           from 'verror'
import { Context }      from 'telegraf'
import { Update, CallbackQuery } from 'telegraf/typings/core/types/typegram'
import makeRandom         from './commands/random'
import openInTelegraph    from './commands/open_in_telegraph'
import likeDoujin         from './commands/like'
import help, { editHelp } from './commands/help'

export default async function callbackHandler(ctx: Context<Update>, callback_query: CallbackQuery.DataCallbackQuery): Promise<void> {
  const data: string = callback_query.data
  if (data === 'r'){
    try {
      await makeRandom(ctx,'next')
    } catch (error) {
      throw new Verror(error, 'Handling Random:next button')
    }
  } else if (data === 'previous'){
    try {
      await makeRandom(ctx,'previous')
    } catch (error) {
      throw new Verror(error, 'Handling Random:previous button')
    }
  } else if (data.match('open')) {
    try {
      await openInTelegraph(ctx, data)
    } catch (error) {
      throw new Verror(error, 'Handling openInTelegraph')
    }
  } else if (data.match('like_')){
    try {
      await likeDoujin(ctx, callback_query)
    } catch (error) {
      throw new Verror(error, 'Handling like')
    }
  } else if (data === 'searchtips') {
    try {
      await editHelp(ctx, callback_query)
    } catch (error) {
      throw new Verror(error, 'Showing search tips')
    }
  } else if (data === 'helpsearchback') {
    try {
      await help(ctx)
    } catch (error) {
      throw new Verror(error, 'Editing help')
    }
  }
}