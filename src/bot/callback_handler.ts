import {Context} from 'telegraf'
import {Update} from 'telegraf/typings/core/types/typegram'
import makeRandom from './commands/random'
import openInTelegraph from './commands/open_in_telegraph'
import likeDoujin from './commands/like'
import Verror from 'verror'

export default async function callbackHandler(ctx: Context<Update>, query: string): Promise<void> {
  console.log(query)
  if (query === 'r'){
    try {
      await makeRandom(ctx,'next')
    } catch (error) {
      throw new Verror(error, 'Random - \'next\' button')
    }
  } else if (query === 'previous'){
    try {
      await makeRandom(ctx,'previous')
    } catch (error) {
      throw new Verror(error, 'Random - \'previous\' button')
    }
  } else if (query.match('open')) {
    try {
      await openInTelegraph(ctx)
    } catch (error) {
      throw new Verror(error, 'openInTelegraph')
    }
  } else if (query.match('like_')){
    try {
      await likeDoujin(ctx)
    } catch (error) {
      throw new Verror(error, 'likeDoujin')
    }
  }
}