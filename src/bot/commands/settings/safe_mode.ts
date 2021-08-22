import config from '../../../../config'
import { User } from '../../../models/user.model'
import Verror from 'verror'

export async function toggle_safe_mode(user: User): Promise<void> {
  const tags = user.ignored_random_tags || []
  if (isSafeModeOn(user)) {
    console.log('turning off safe mode')
    for(let i=0; i< config.awful_tags.length; i++){
      for( let t = 0; t < tags.length; t++){ 
        if ( tags[t] === config.awful_tags[i]) { 
          tags.splice(t, 1) 
        }
      }
    }
  } else {
    console.log('turning on safe mode')
    config.awful_tags.forEach(tag => {
      if(!tags.includes(tag)){
        tags.push(tag)
      }
    })
  }
  try {
    await user.save()
  } catch (error) {
    throw new Verror(error, 'Saving user')
  }
}
export function isSafeModeOn(user: User): boolean {
  const tags = user.ignored_random_tags || []
  let result = 0
  tags.forEach(element => {
    if (config.awful_tags.includes(element)){
      result+=1
    }
  })

  return result === config.awful_tags.length
}