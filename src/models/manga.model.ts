import { Schema, model } from 'mongoose'

export interface MangaI {
  id: string // <source>_<id>
  title?: string
  description?: string
  tags?: string[]
  pages?: number
  thumbnail?: string
  previews?: {
    telegraph_url?: string
    fixed_pages?: string[]
  }
  createdAt: Date
  updatedAt: Date
}
export const mangaSchema: Schema<MangaI> = new Schema({
	id: { type: String, required: true }, // <source>_<id>
	title: String,
	description: String,
	tags: [String],
	pages: Number,
	thumbnail: String,
	previews: {
		telegraph_url: String,
		fixed_pages: [String],
	},
}, { timestamps: true })

export const Manga = model<MangaI>('Manga', mangaSchema)
// export type Manga = MangaSchema & Document<any, any, MangaSchema>
export default model<MangaI>('Manga', mangaSchema)
