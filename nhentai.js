const request = require("superagent");
const cheerio = require("cheerio");
const tagSpacerPatternn = /(\([0-9,]+\))([a-zA-Z])/g;
const tagSplitPattern = /\d+K|\d+$/gm;

const urlToId = /(https?:\/\/nhentai\.net\/g\/)(\d+)\/?.*/;
const gToId = /\/g\/(\d+)\//;
const hrefToPage = /(&||\?)page=(\d+)/;
const doubleSlashToHttps = /(https:)?(\/\/)/;
const styleToAspectRatio = /padding:0 0 (.*)% 0/;
const resultsToInt = /(.*) Results/i;

class nHentai {
  static getDoujin(identifier) {
    if (!identifier) {
      return;
    }
    const id = identifier.toString().replace(urlToId, "$2");
    return new Promise((resolve, reject) => {
      request
        .get("https://nhentai.net/g/" + id + "/")
        .then((res) => {
          const $ = cheerio.load(res.text);
          let details = {};
          let tagsstr = $(".tag-container.field-name")
            .text()
            .split("\n")
            .map((string) => string.trim())
            .filter((u) => u)
            .map((tag, i, tags) => {
              if (tag.endsWith(":") && !tags[i + 1].endsWith(":")) {
                details[tag.substring(0, tag.length - 1).toLowerCase()] = tags[
                  i + 1
                ]
                  .replace(tagSpacerPatternn, "$1 $2")
                  .split(tagSplitPattern);
              }
            });

          const title = $("#info").find("h1").text();
          const nativeTitle = $("#info").find("h2").text();
          const thumbnails = Object.entries($(".gallerythumb").find("img"))
            .map((image) => {
              return image[1].attribs ? image[1].attribs["data-src"] : null;
            })
            .filter((link) => link);
          const images = Object.entries($(".gallerythumb").find("img"))
            .map((image) => {
              return image[1].attribs
                ? image[1].attribs["data-src"]
                    .replace(/t(\.(jpg|png|gif))/, "$1")
                    .replace("t.nhentai", "i.nhentai")
                : null;
            })
            .filter((link) => link);
          details.pages = images.length;
          const link = `https://nhentai.net/g/${id}/`;
          resolve({
            id,
            title,
            nativeTitle,
            details,
            pages: images,
            thumbnails,
            link,
          });
        })
        .catch(reject);
    });
  }

  static getHomepage(page = 1) {
    return new Promise((resolve, reject) => {
      if (page <= 0) {
        reject(new Error("Page must be greater than or equal to 1"));
        return;
      }

      request
        .get("https://nhentai.net/?page=" + page)
        .then((res) => {
          const $ = cheerio.load(res.text);
          let details = [];
          let selector = $(".gallery").children("a");
          Object.keys(selector).map((key) => {
            if (parseInt(key)) {
              let bookdetails = {};
              let book = selector[key];
              let img = findObject(book.children, "name", "img");
              bookdetails.id = parseInt(book.attribs.href.replace(gToId, "$1"));
              bookdetails.thumbnailAspectRatio = book.attribs.style.replace(
                styleToAspectRatio,
                "$1"
              );
              if ("is" in img.attribs) {
                bookdetails.thumbnail = img.attribs["data-src"];
              } else {
                bookdetails.thumbnail = img.attribs["src"].replace(
                  doubleSlashToHttps,
                  "https://"
                );
              }
              bookdetails.title = findObject(
                book.children,
                "name",
                "div"
              ).children[0].data;
              details.push(bookdetails);
            }
          });
          resolve({
            results: details,
            lastPage: $(".last")[0]
              ? $(".last")[0].attribs.href.match(hrefToPage)[2]
              : page,
          });
        })
        .catch(reject);
    });
  }

  static search(query, page = 1, sort = "date") {
    return new Promise((resolve, reject) => {
      if (!query) {
        reject(new Error("Query cannot be empty"));
        return;
      }

      if (page <= 0) {
        reject(new Error("Page must be greater than or equal to 1"));
        return;
      }

      const sortMethod = sort.toLowerCase();

      if (!["popular", "date"].includes(sortMethod)) {
        reject(new Error("Invalid sorting"));
      }

      request
        .get("https://nhentai.net/search/")
        .query({
          q: query,
          page,
          sort: sortMethod,
        })
        .then((res) => {
          const $ = cheerio.load(res.text);
          let details = [];
          let selector = $(".gallery");
          Object.keys(selector).map((key) => {
            if (parseInt(key)) {
              let bookdetails = {};
              let book = selector.children("a")[key];
              let img = findObject(book.children, "name", "img");
              bookdetails.id = parseInt(book.attribs.href.replace(gToId, "$1"));
              bookdetails.thumbnailAspectRatio = book.attribs.style.replace(
                styleToAspectRatio,
                "$1"
              );
              bookdetails.thumbnail = img.attribs["data-src"]
                ? img.attribs["data-src"]
                : img.attribs["src"];
              bookdetails.title = findObject(
                book.children,
                "name",
                "div"
              ).children[0].data;

              let dataTags = selector[key].attribs["data-tags"].split(" ");
              if (dataTags.includes("6346")) bookdetails.language = "japanese";
              else if (dataTags.includes("12227"))
                bookdetails.language = "english";
              else if (dataTags.includes("29963"))
                bookdetails.language = "chinese";
              bookdetails.tags = dataTags;

              details.push(bookdetails);
            }
          });

          let numberOfResults = $("#content")[0].children[1].children[1].data
            ? $("#content")[0]
                .children[1].children[1].data.match(resultsToInt)[1]
                .split(",")
                .join("")
                .trim()
            : 0;
          if (parseInt(numberOfResults)) {
            numberOfResults = parseInt(numberOfResults);
          } else {
            numberOfResults = 0;
          }
          resolve({
            results: details,
            lastPage: $(".last")[0]
              ? $(".last")[0].attribs.href.match(hrefToPage)[2]
              : page,
            totalSearchResults: numberOfResults,
          });
        })
        .catch(reject);
    });
  }

  static exists(identifier) {
    const id = identifier.replace(urlToId, "$2");
    return new Promise((resolve, reject) => {
      request
        .head("https://nhentai.net/g/" + id + "/")
        .then((res) => resolve(true))
        .catch((err) => {
          resolve(false);
        });
    });
  }
}

function findObject(obj, key, value) {
  const found = Object.entries(obj).filter(
    (object) => object[1][key] === value
  )[0];
  if (!found) {
    return null;
  }
  return found[1];
}

module.exports = nHentai;
