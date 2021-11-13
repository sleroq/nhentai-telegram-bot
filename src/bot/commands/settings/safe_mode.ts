import Werror from '../../../lib/error'
import { User } from '../../../models/user.model'

const ignoredTags = process.env.IGNORED_TAGS ? process.env.IGNORED_TAGS.split(', ') : []

export async function toggle_safe_mode(user: User): Promise<void> {
	const tags = user.ignored_random_tags || []
	if (isSafeModeOn(user)) {
		console.log('turning off safe mode')
		for(let i=0; i< ignoredTags.length; i++){
			for( let t = 0; t < tags.length; t++){ 
				if ( tags[t] === ignoredTags[i]) {
					tags.splice(t, 1) 
				}
			}
		}
	} else {
		console.log('turning on safe mode')
		ignoredTags.forEach(tag => {
			if(!tags.includes(tag)){
				tags.push(tag)
			}
		})
	}
	try {
		await user.save()
	} catch (error) {
		throw new Werror(error, 'Saving user')
	}
}
export function isSafeModeOn(user: User): boolean {
	const tags = user.ignored_random_tags || []
	let result = 0
	tags.forEach(element => {
		if (ignoredTags.includes(element)){
			result += 1
		}
	})

	return result === ignoredTags.length
}