import mongoose, { Connection } from 'mongoose'
import userSchema, { UserSchema } from '../models/user.model'

let connection2: Connection | undefined

export default async function connectToMongo() {
	if (!process.env.DATABASE_URL) {
		throw new Error('No DATABASE_URL in env')
	}
	const status = await mongoose.connect(process.env.DATABASE_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})

	if (process.env.DATABASE2_URL) {
		console.log('Second db is connected!')
		connection2 = await mongoose.createConnection(process.env.DATABASE2_URL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
	}

	if (status) {
		console.log('Mongoose is connected!')
		return
	}
	throw new Error('Can`t connect to MongoDB')
}

export function getUserModel() {
	if (connection2) {
		//@ts-ignore
		return connection2.model<UserSchema>('User', userSchema)
	} else {
		return mongoose.model<UserSchema>('User', userSchema)
	}
}