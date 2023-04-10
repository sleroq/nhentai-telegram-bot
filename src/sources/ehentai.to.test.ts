import test from 'ava'
import eHentai from './ehentai.to.js'

test('ehentai.to get doujin', async (t) => {
	const c = new eHentai()
	const doujin = await c.doujin('366224')

	console.log(doujin)
	console.log(doujin.details)

	t.assert(doujin.id === '366224')
	t.assert(
		doujin.title.translated.full ===
      '[Puu no Puupuupuu (Puuzaki Puuna)] Hitozukiai ga Nigate na Miboujin no Yukionna-san to Noroi no Yubiwa [English]'
	)

	t.assert(
		doujin.details.tags.find((t) => t.name === 'femdom')?.url ===
      'https://ehentai.to/tag/femdom/'
	)
})
