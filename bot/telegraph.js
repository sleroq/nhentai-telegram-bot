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
  console.log("start uploaing url")
  let pages = manga.images ? manga.images  : manga.pages;
  let result = await telegraphCreatePage(manga, pages).catch((err) => {
    console.log(err);
  });
  if (!result) {
    return;
  }
  return result.url;
}
module.exports = {
  TelegraphUploadByUrls,
  telegraphCreatePage,
};
