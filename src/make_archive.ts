import got from 'got'
import archiver from 'archiver'
import { Response } from 'got'
import fs from 'fs'
import { getIdfromUrl } from './nhentai'

export default async function makeArchive(images: string[]): Promise<string> {
  const archive = archiver('zip', {
    zlib: { level: 10 }
  })
  archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      console.log('Warning creating archive:')
      console.log(err)
    } else {
      console.log('Error creating archive:')
      console.log(err)
    }
  })
  archive.on('error', function(err) {
    console.log('Error creating archive:')
    console.log(err)
  })
  const fileName = (Math.random() + 1).toString(36).substring(7)
  const zipStream = fs.createWriteStream(fileName)

  zipStream.on('close', function() {
    console.log(archive.pointer() + ' total bytes')
    console.log('archiver has been finalized and the output file descriptor has closed.')
  })
  for(const image of images){
    let response: Response<Buffer> | undefined
    const imageName = String(getIdfromUrl(image))
    try {
      response = await got(image, { responseType: 'buffer' })
    } catch (error) {
      console.log('Error getting image ' + image)
      console.log(error)
      continue
    }
    archive.append(response.body, { name: imageName })
  }
  archive.pipe(zipStream)
  await archive.finalize()
  return fileName
}