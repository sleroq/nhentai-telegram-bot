import User, { UserSchema } from '../models/user.model'
import config from '../../config'
import { Context } from 'telegraf'
import { Document } from 'mongoose'
import i18n from '../i18n'
import Verror from 'verror'

export default async function saveAndGetUser(ctx: Context): Promise<UserSchema & Document<any, any, UserSchema>> {
  if (!ctx.from) {
    throw new Verror('Saving user: !ctx.from')
  }
  let user: UserSchema & Document<any, any, UserSchema> | null = null
  try {
    user = await User.findById(ctx.from.id)
  } catch (error) {
    console.log('Error when getting user')
    console.log(error)
  }
  if (!user) {
    user = new User({
      _id:                  ctx.from.id,
      username:             ctx.from.username,
      first_name:           ctx.from.first_name,
      last_name:            ctx.from.last_name,
      language_code:        ctx.from.language_code,
      search_sorting:       config.search_sorting_by_default,
      search_type:          config.search_appearance_by_default,
      ignored_random_tags:  config.awful_tags,
      random_localy:        config.random_localy_by_default,
      can_repeat_in_random: config.can_repeat_in_random_by_default,
    })

    try {
      await user.save()
    } catch (error) {
      console.log('Error saving user')
      console.log(error)
    }
    console.log('New user saved!')
  }
  if (user.language_code == 'ru') {
    i18n.setLocale('ru')
  }
  if (user.language_code == 'es') {
    i18n.setLocale('es')
  }
  return user
}
