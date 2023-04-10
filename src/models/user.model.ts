import { Schema, Types, model, Document } from 'mongoose'

export interface UserI {
	_id: string;
	username?: string;
	first_name?: string;
	last_name?: string;
	language_code?: string;

	settings: {
		search_sorting?: string;
		search_type?: string;

		empty_query?: string;
		default_search_query?: string;

		random_locally?: boolean;
		can_repeat_in_random?: boolean;
		ignored_random_tags?: string[];
		default_random_tags?: string[];
	};

	favorites: Types.ObjectId[];
	history: Types.ObjectId[];
	search_history: string[];
	createdAt: Date;
	updatedAt: Date;
}

export const userSchema = new Schema<UserI>(
	{
		_id: { type: String, required: true },
		username: String,
		first_name: String,
		last_name: String,
		language_code: String,

		settings: {
			search_sorting: String,
			search_type: String,

			empty_query: String,
			default_search_query: String,

			random_locally: Boolean,
			can_repeat_in_random: Boolean,
			ignored_random_tags: [String],
			default_random_tags: [String],
		},

		favorites: [{ type: Schema.Types.ObjectId, ref: 'Manga' }],
		history: [{ type: Schema.Types.ObjectId, ref: 'Manga' }],
		search_history: { type: [String], required: true },
	},
	{ timestamps: true }
)

// eslint-disable-next-line
export type User = UserI & Document<any, any, UserI>;
export default model<UserI>('User', userSchema)
