import {Context} from 'telegraf'
import {Update} from 'telegraf/typings/core/types/typegram'
import makeRandom from './commands/random'
import openIInTelegraph from './commands/open_in_telegraph'

export default async function callbackHandler(ctx: Context<Update>, query: string): Promise<void> {
  if (query === 'r'){
    await makeRandom(ctx,'next')
  } else if (query === 'previous'){
    await makeRandom(ctx,'previous')
  } else if (query.match('open')) {
    await openIInTelegraph(ctx)
  }
}