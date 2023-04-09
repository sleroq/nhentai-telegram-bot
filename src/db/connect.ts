import Werror from '../lib/error.js'
import mongoose   from 'mongoose'
mongoose.set('strictQuery', false)

export default async function connectToMongo(db: string) {
	try {
		await mongoose.connect(db)
	} catch (error) {
		throw new Werror(error, 'Unable to connect to database :(')
	}

	console.log('Mongoose is connected!')
}