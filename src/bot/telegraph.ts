import config from '../../config'
import { Doujin } from '../nhentai'
import Telegraph from 'telegra.ph'
import { Node, Page } from 'telegra.ph/typings/telegraph'
import { Document } from 'mongoose'
import { MangaSchema } from '../models/manga.model'

let token: string | undefined;

(async () => {
  if (!process.env.TELEGRAPH_TOKEN) {
    console.error('No token for telegra.ph')
    token = await createAccount()
  } else {
    token = process.env.TELEGRAPH_TOKEN
  }
})()

if (!token) {
  throw new Error('This can\'t happen, but typescript thinks it can.')
}
const client = new Telegraph(token)

export async function createAccount(): Promise<string> {
  const account = await client.createAccount(config.bot_username, config.bot_username)
  if (!account.access_token) {
    throw new Error('Could not create an account for telegra.ph: no access_token')
  }
  return account.access_token
}

export async function telegraphCreatePage(
  manga: Doujin | MangaSchema & Document<any, any, MangaSchema>,
  images: string[],
  username = config.bot_username
): Promise<Page> {
  const page: Node[] = []
  return client.createPage(
    `${manga.title}`,
    page
      .concat(
        images.map((image) => ({
          tag:   'img',
          attrs: { src: `${image}` },
        }))
      )
      .concat([
        {
          tag:      'a',
          children: [config.text_at_the_end_of_telegraph_page],
        },
      ]),
    '@' + username,
    'https://t.me/' + username,
    true
  )
}
export default async function TelegraphUploadByUrls(
  manga: Doujin | MangaSchema & Document<any, any, MangaSchema>,
  images?: string[]
): Promise<string> {
  console.log('start uploading url')
  const pages = images || manga.pages
  if(typeof pages === 'number'){
    throw new Error('You have to provide pages, or Doujin with them')
  }
  const articlePage = await telegraphCreatePage(manga, pages)

  if (!articlePage || articlePage.url) {
    throw new Error('Could not create a page: no page url')
  }
  console.log('returning uploaded url')
  return articlePage.url
}