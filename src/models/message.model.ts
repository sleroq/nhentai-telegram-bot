import { Schema, model, Types, Document } from 'mongoose'

export interface MessageI {
  chat_id: string;
  message_id: number;
  current?: number;
  history: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageI>(
	{
		chat_id: { type: String, required: true },
		message_id: { type: Number, required: true },
		current: Number,
		history: [{ type: Schema.Types, ref: 'Manga' }],
	},
	{ timestamps: true }
)

// eslint-disable-next-line
export type Message = MessageI & Document<any, any, MessageI>;
export default model<MessageI>('Message', messageSchema)
