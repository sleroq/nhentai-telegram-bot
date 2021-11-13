import MangaModel, { Manga } from '../models/manga.model'
import { FilterQuery }       from 'mongoose'

export default async function getRandomMangaLocally(
	tags: string[] | undefined,
	ninTags: string[] | undefined
): Promise<Manga | null> {
	const query: FilterQuery<typeof MangaModel> = { tags: { } }
	if (tags?.length !== 0 && query) {
		query.tags.$in = tags
	}
	if (ninTags?.length !== 0 && query) {
		query.tags.$nin = ninTags
	}
	
	let count: number | undefined
	if (query.tags.$in || query.tags.$nin){
		count = await MangaModel.countDocuments(query)
		const random = Math.floor(Math.random() * count)
		return MangaModel.findOne(query).skip(random)
	} else {
		count = await MangaModel.countDocuments()
		const random = Math.floor(Math.random() * count)
		return MangaModel.findOne().skip(random)
	}
}