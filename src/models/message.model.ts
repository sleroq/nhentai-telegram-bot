import { Schema, model, Types } from 'mongoose'

export interface MessageI {
	chat_id: string
	message_id: number
  current?: number
  history: Types.ObjectId[]
	createdAt: Date
	updatedAt: Date
}

const messageSchema = new Schema<MessageI>({
	chat_id:    { type: String, required: true },
	message_id: { type: Number, required: true },
	current:    Number,
	history:    [{ type: Schema.Types, ref: 'Manga' }],
}, { timestamps: true })

export const Message = model<MessageI>('Message', messageSchema)
// export type Message = MessageI & Document<any, any, MessageI>
export default model<MessageI>('Message', messageSchema)
