import Werror from '../lib/error'

import mongoose, { Connection }   from 'mongoose'
import userSchema, { UserSchema } from '../models/user.model'

let connection2: Connection | undefined

export default async function connectToMongo(database1: string, database2?: string) {
	try {
		await mongoose.connect(database1)
	} catch (error) {
		throw new Werror(error, 'Unable to connect to second database :(')
	}

	if (database2) {
		try {
			connection2 = await mongoose.createConnection(database2)
		} catch (error) {
			throw new Werror(error, 'Unable to connect to second database :(')
		}
		console.log('Second db is connected!')
	}
	console.log('Mongoose is connected!')
}

export function getUserModel() {
	if (connection2) {
		return connection2.model<UserSchema>('User', userSchema)
	} else {
		return mongoose.model<UserSchema>('User', userSchema)
	}
}