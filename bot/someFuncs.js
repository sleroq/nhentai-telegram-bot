const nhentai = require("nhentai-js");

async function doujinExists(id) {
  const val = await nhentai.exists(id);
  return val;
}

async function getDoujin(id) {
  try {
    // try/catch is the equivalent of Promise.catch() in async/await
    const val = await nhentai.getDoujin(id);
    return val;
  } catch (err) {
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
    tags = "",
    tagsArray = manga.details.tags[0]
      .replace(/\d+K/gm, 123)  // replace number of doujins with number
      .replace(/-+/gm, "\\_")  // replace all dashes
      .replace(/\s+/gm, "\\_") // replace all spaces
      .split(/\d+/gm);         // split by number of doujins
  for (let i = 0; i < tagsArray.length; i++) {
    if (tagsArray && tagsArray[i]) {
      let replacedSpace = tagsArray[i];
      tags += "#" + replacedSpace;
    }
    if (i != tagsArray.length - 1 && tagsArray[i + 1] != "") {
      tags += ", ";
    }
  }
  let caption = `[${title()}](${telegraphLink}) (${
    manga.details.pages[0]
  } pages)\nTags: ${tags}\n[nHentai page](${manga.link})`;
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
  return s2;
}
function getMangaDescription(manga) {
  let title = () => {
    if (manga.title.pretty) {
      return manga.title.pretty.replace(/[\(\)\[\]_\*~`]/g, " ");
    } else {
      return manga.title.replace(/[\(\)\[\]_\*~`]/g, " ");
    }
  };
  let link = "https://nhentai.net/g/" + manga.id + "/";
  let caption = `[${title()}](${link})`;
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
};
