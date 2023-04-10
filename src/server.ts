import mongoose from 'mongoose'
import { pino } from 'pino'
import Werror from './lib/error.js'
import start from './bot/index.js'
import dotenv from 'dotenv'

dotenv.config()
mongoose.set('strictQuery', false)
const logger = pino()

const { DATABASE_URL, BOT_TOKEN } = process.env

if (!DATABASE_URL || !BOT_TOKEN)
	throw new Error('DATABASE_URL and BOT_TOKEN are required')

try {
	await mongoose.connect(DATABASE_URL)
} catch (err) {
	throw new Werror(err, 'Failed to connect to the database')
}
logger.info('Database connection established')

await start(BOT_TOKEN, logger)
