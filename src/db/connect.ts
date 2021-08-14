import mongoose from 'mongoose'

export default async function connectToMongo(){
  if (!process.env.DATABASE_URL) {
    throw new Error('No DATABASE_URL in env')
  }
  const status = await mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  })
  if (status){
    console.log('mongoose is connected!')
    return
  }
  throw new Error('Can`t connect to MongoDB')
}