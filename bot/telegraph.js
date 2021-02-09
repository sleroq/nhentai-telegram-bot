const Telegraph = require("telegra.ph");
const client = new Telegraph(process.env.TELEGRAPH_TOKEN);

async function telegraphCreatePage(
  manga,
  images,
  username = "nhentai_mangabot"
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
          children: ["Thanks for reading this chapter!"],
        },
      ]),
    "@" + username,
    "https://t.me/" + username,
    true
  );
}
async function TelegraphUploadByUrls(manga) {
  let pages = manga.images ? manga.images  : manga.pages;
  console.log(pages + " --- pages")
  let result = await telegraphCreatePage(manga, pages).catch((err) => {
    console.log(err);
  });
  if (!result) {
    return;
  }
  console.log(result.url + " --- result.url")
  return result.url;
}
module.exports = {
  TelegraphUploadByUrls,
  telegraphCreatePage,
};
