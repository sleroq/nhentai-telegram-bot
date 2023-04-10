import { Schema, model, Document } from 'mongoose'

export interface MangaI {
	id: string; // <source>_<id>
	title: string;
	description: string;
	tags: string[];
	pages: number;
	thumbnail: string;
	previews: {
		telegraph_url: string;
	};
	createdAt?: Date;
	updatedAt?: Date;
}
export const mangaSchema: Schema<MangaI> = new Schema(
	{
		id: { type: String, required: true }, // <source>_<id>
		title: { type: String, required: true },
		description: { type: String, required: true },
		tags: { type: [String], required: true },
		pages: { type: Number, required: true },
		thumbnail: { type: String, required: true },
		previews: {
			type: {
				telegraph_url: { type: String, required: true },
			},
			required: true,
		},
	},
	{ timestamps: true }
)

// eslint-disable-next-line
export type Manga = MangaI & Document<any, any, MangaI>;
export default model<MangaI>('Manga', mangaSchema)
