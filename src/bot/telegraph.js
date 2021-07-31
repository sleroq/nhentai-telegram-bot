const Telegraph = require("telegra.ph");
const client = new Telegraph(process.env.TELEGRAPH_TOKEN);
const config = require('../config.json');

async function telegraphCreatePage(
  manga,
  images,
  username = config.bot_username
) {
  return client.createPage(
    `${manga.title}`,
    []
      .concat(
        images.map((image) => ({
          tag: "img",
          attrs: { src: `${image}` },
        }))
      )
      .concat([
        {
          tag: "a",
          children: [config.text_at_the_end_of_telegraph_page],
        },
      ]),
    "@" + username,
    "https://t.me/" + username,
    true
  );
}
async function TelegraphUploadByUrls(manga) {
  console.log("start uploaing url")
  let pages = manga.images ? manga.images  : manga.pages;
  let result = await telegraphCreatePage(manga, pages).catch((err) => {
    console.log(err);
  });
  if (!result) {
    return;
  }
  console.log("returning uploaded url")
  return result.url;
}
module.exports = {
  TelegraphUploadByUrls,
  telegraphCreatePage,
};
