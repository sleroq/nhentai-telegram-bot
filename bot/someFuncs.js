const nhentai = require('nhentai-js')

async function doujinExists(id){
    const val = await nhentai.exists(id)
    return val
}

async function getDoujin(id){
    try{ // try/catch is the equivalent of Promise.catch() in async/await
        const val = await nhentai.getDoujin(id)
        return val
    }catch(err){
        console.error(err);
    }
}
async function getRandomManga() {
  let homepage = await nhentai.getHomepage(),
    newestMangaId = +homepage.results[0].bookId;
  for (let i = 0; i < 100; i++) {
    let randomId = Math.floor(Math.random() * newestMangaId) + 1,
      manga = await getDoujin(randomId.toString());
    if (doujinExists("randomId")) {
      return manga;
    }
  }
}
function getMangaMessage(manga, telegraphLink) {
  let title = () => {
    if (manga.title.pretty) {
      return manga.title.pretty.replace(/[\(\)\[\]_\*~`]/g, " ");
    } else {
      return manga.title.replace(/[\(\)\[\]_\*~`]/g, " ");
    }
  },
  tagsString = "";
    // tagsString += "\nTags: ";
    // for (let i = 0; i < manga.tags.length; i++) {
    //   let tag = manga.tags[i].name.replace(/\-+/g, "\\_"),
    //     tagName = tag.replace(/\s+/g, "\\_");
    //   tagsString += "#" + tagName;
    //   if (i != manga.tags.length - 1) {
    //     tagsString += ", ";
    //   }
    // }
  let caption = `[${title()}](${telegraphLink}) (${manga.details.pages[0]} pages)${tagsString}\n`;
  return caption;
}
function sliceByHalf(s) {
  let middle = Math.floor(s.length / 2);
  let before = s.lastIndexOf(" ", middle);
  let after = s.indexOf(" ", middle + 1);

  if (before == -1 || (after != -1 && middle - before >= after - middle)) {
    middle = after;
  } else {
    middle = before;
  }

  let s1 = s.substr(0, middle);
  let s2 = s.substr(middle + 1);
  console.log(s1);
  console.log(s2);
  return s2;
}
function getMangaDescription(manga) {
    let title = () => {
    if (manga.title.pretty) {
      return manga.title.pretty.replace(/[\(\)\[\]_\*~`]/g, " ");
    } else {
      return manga.title.replace(/[\(\)\[\]_\*~`]/g, " ");
    }
  }
    let caption = `[${title()}](${manga.link})`;
  return caption;
}
function searchDescription(manga) {
  let title = manga.title;
  if (title.match(/ch/gi)) {
    if (title.split(/ch.\s/i)[1]) {
      return "Ch. " + title.split(/ch.\s/i)[1];
    } else {
      return sliceByHalf(title);
    }
  } else {
    return title;
  }
}
module.exports = {
  doujinExists,
  getDoujin,
  getRandomManga,
  getMangaMessage,
  getMangaDescription,
  sliceByHalf,
  searchDescription
}