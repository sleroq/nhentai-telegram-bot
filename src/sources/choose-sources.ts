import { User } from '../models/user.model.js'
import { Source } from './index.js'
import nHentai from './nhentai.js'

// @ts-ignore
export default function chooseSource(user: User): Source {
	// Some logic here

	return new nHentai()
}
