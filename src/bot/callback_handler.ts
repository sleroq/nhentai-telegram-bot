import saveAndGetUser from '../db/save_and_get_user'
import Verror from 'verror'
import {Context} from 'telegraf'
import {Update} from 'telegraf/typings/core/types/typegram'
import {UserSchema} from '../models/user.model'
import { Document } from 'mongoose'
import makeRandom from './commands/random'

export default async function callbackHandler(ctx: Context<Update>, query: string): Promise<void> {
  let user: UserSchema & Document<any, any, UserSchema> | undefined
  try {
    user = await saveAndGetUser(ctx)
  } catch (error) {
    throw new Verror(error, 'Getting user in callbackHandler')
  }
  if (query === 'r'){
    await makeRandom(ctx, user)
  }
}