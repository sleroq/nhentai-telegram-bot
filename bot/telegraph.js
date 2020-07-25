const Telegraph = require("telegra.ph");
const client = new Telegraph(process.env.TELEGRAPH_TOKEN);
const db = require("../db/dbhandler.js");

async function telegraphCreatePage(
  manga,
  images,
  username = "nhentai_mangabot"
) {
  return client.createPage(
    `${manga.title}`,
    []
      .concat(
        images.map(image => ({
          tag: "img",
          attrs: { src: `${image}` }
        }))
      )
      .concat([
        {
          tag: "a",
          children: ["Thanks for reading this chapter!"]
        }
      ]),
    "@" + username,
    "https://t.me/" + username,
    true
  );
}
async function TelegraphUploadByUrls(manga) {
  let manga_id = manga.link.slice(22, -1),
    mangaExists = await db.getManga(manga_id);
  if (mangaExists) {
    return mangaExists.telegraphUrl;
  }
  let pages = manga.pages;
  let result = await telegraphCreatePage(manga, pages).catch(err => { console.log(err) });
  if (!result) {
    return;
  }
  await db.saveManga(manga, result.url);
  return result.url;
}
module.exports = {
  TelegraphUploadByUrls,
  telegraphCreatePage
};
