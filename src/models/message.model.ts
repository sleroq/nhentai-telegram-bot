import { Schema, model, Document } from 'mongoose'

export interface MessageSchema {
	chat_id:    string
	message_id: number
	current:    number
	history:    number[]
	createdAt?: Date
	updatedAt?: Date
}

const messageSchema = new Schema({
	chat_id:    { type: String, required: true },
	message_id: { type: Number, required: true },
	current:    Number,
	history:    [Number],
}, { timestamps: true })

export type Message = MessageSchema & Document<any, any, MessageSchema>
export default model<MessageSchema>('Message', messageSchema)