import mongoose, { Document } from 'mongoose'

export interface UserSchema {
	_id:            string
	username?:      string
	first_name?:    string
	last_name?:     string
	language_code?: string

	search_sorting?: string
	search_type?:    string

	empty_query?:          string
	default_search_query?: string

	random_localy?:        boolean
	can_repeat_in_random?: boolean
	ignored_random_tags?:  string[]
	default_random_tags:   string[]

	favorites:      Favorite[]
	manga_history:  number[]
	search_history: string[]
	createdAt?:     Date
	updatedAt?:     Date
}

export interface Favorite {
	_id:            string,
	title:          string,
	description?:   string,
	tags?:          string[],
	pages?:         number,
	thumbnail:      string,
	telegraph_url:  string,
}

const userSchema = new mongoose.Schema({
	_id:           { type: String, required: true },
	username:      String,
	first_name:    String,
	last_name:     String,
	language_code: String,

	search_sorting: String,
	search_type:    String,

	empty_query:          String,
	default_search_query: String,

	random_localy:        Boolean,
	can_repeat_in_random: Boolean,
	ignored_random_tags:  [String],
	default_random_tags:  [String],

	favorites: [
		new mongoose.Schema({
			_id:           { type: String, required: true },
			title:         String,
			description:   String,
			tags:          [String],
			pages:         Number,
			thumbnail:     String,
			telegraph_url: String,
		}),
	],
	manga_history:  [Number],
	search_history: [String],
}, { timestamps: true })

export type User = UserSchema & Document<any, any, UserSchema>
export default userSchema