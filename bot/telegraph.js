const Telegraph = require('telegra.ph')
const client = new Telegraph(process.env.TELEGRAPH_TOKEN)
const { uploadByUrl } = require("telegraph-uploader");
const db = require("../db/dbhandler.js");

async function telegraphCreatePage (
  manga,
  images,
  username = 'nhentai_mangabot'
) {
  return client.createPage(
    `${manga.title}`,
    [].concat(
      images.map(image => ({
        tag: 'img',
        attrs: { src: `${image}` }
      }))
    ).concat(
      [
        {
          tag: 'a',
          children: ['Thanks for reading this chapter!']
        }
      ]
    ),
    '@nhentai_mangabot',
    'https://t.me/nhentai_mangabot',
    true
  )
}
async function TelegraphUploadByUrls(manga) {
    let manga_id = manga.link.slice(22, -1),
    mangaExists = await db.getManga(manga_id)
    if(mangaExists){
      console.log('manga was in db')
      return mangaExists.telegraphUrl
    }
    let pages = manga.pages;
    let result = await telegraphCreatePage(manga, pages);
    await db.saveManga(manga, result.url)
    return result.url;
}
module.exports = {
    TelegraphUploadByUrls,
}