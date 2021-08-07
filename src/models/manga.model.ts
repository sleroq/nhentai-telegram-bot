import { Schema, model } from 'mongoose'

export interface MangaSchema {
  id:                   number
  title:                string
  description?:         string
  tags?:                string[]
  pages:                number
  page0?:               string
  thumbnail?:           string
  telegraph_url?:       string
  telegraph_fixed_url?: string
  fixed_pages:          string[]
  createdAt?:           Date
  updatedAt?:           Date
}
const mangaSchema = new Schema({
  id:                  { type: Number, required: true },
  title:               String,
  description:         String,
  tags:                [String],
  pages:               Number,
  page0:               String,
  thumbnail:           String,
  telegraph_url:       String,
  telegraph_fixed_url: String,
  fixed_pages:         [String],
}, { timestamps: true })

export default model<MangaSchema>('Manga', mangaSchema)