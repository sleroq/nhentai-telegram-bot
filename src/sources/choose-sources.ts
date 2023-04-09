import { Source } from './index.js'
import eHentai from './ehentai.to.js'

export default function chooseSource(source?: string): Source {
	switch (source) {
	default:
		return new eHentai()
	}
}
