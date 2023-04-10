import test from 'ava'
import { getAPIUrl } from './e-hentai.js'

test('e-hentai APIUrl', async (t) => {
	const apiUrl = getAPIUrl('https://e-hentai.org')
	t.assert(apiUrl === 'https://api.e-hentai.org/api.php')
})
