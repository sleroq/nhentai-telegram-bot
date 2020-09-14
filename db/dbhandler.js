const Database = require("better-sqlite3");
const db = new Database("./db/memory.db"); //, { verbose: console.log });
// db.prepare(`DROP TABLE users;`).run()
// db.prepare(
//   `CREATE TABLE IF NOT EXISTS users (
//       user_id INTEGER NOT NULL UNIQUE,
//       fromu TEXT,
//       sort TEXT,
//       search_type TEXT,
//       stage TEXT,
//       settings TEXT
//   );`
// ).run();
// db.prepare(
//   `CREATE TABLE IF NOT EXISTS telegraphposts (
//       manga_id INT UNIQUE,
//       mangaUrl TEXT UNIQUE,
//       mangaName TEXT,
//       mangaTags TEXT,
//       telegraphUrl TEXT UNIQUE,
//       fixed INT
//   );`
// ).run();
// // db.prepare(`DROP TABLE users;`).run()
// db.prepare(
//   `CREATE TABLE IF NOT EXISTS users (
//       user_id INTEGER NOT NULL UNIQUE,
//       fromu TEXT,
//       sort TEXT,
//       search_type TEXT,
//       stage TEXT,
//       settings TEXT
//   );`
// ).run();
const User = require("../models/user.model");
const Manga = require("../models/manga.model");
const { saveAndGetUser } = require("./saveAndGetUser");
const nhentai = require("../nhentai");

// migrateDB_manga();
// migrateDB_users();
async function migrateDB_users() {
  let getUsers = await db.prepare(`SELECT user_id FROM users`).all();
  let users = getUsers.map((user) => user.user_id);
  console.log("There are " + users.length + " users");

  for (let i = 0; i < users.length; i++) {
    let userMongo = await User.findById(users[i], function (err) {
      if (err) console.log(err);
    });

    if (!userMongo) {
      let getuserSqlite = await db
        .prepare(`SELECT * FROM users WHERE user_id=?`)
        .get(users[i]);
      fromu = JSON.parse(getuserSqlite.fromu);
      let saveUser = new User({
        _id: fromu.id,
        username: fromu.username,
        first_name: fromu.first_name,
        last_name: fromu.last_name,
        language_code: fromu.language_code,
        search_sorting: "date",
        search_type: "article",
        random_localy: false,
      });

      await saveUser.save(function (err) {
        if (err) return console.error(err);
        console.log("user saved");
      });
    }
    if (i == users.length - 1) {
      console.log(users.length + " users saved B-)");
    }
  }
}
async function migrateDB_manga() {
  let mangas = await db.prepare(`SELECT * FROM telegraphposts`).all();
  // let users = getUsers.map((user) => user.user_id);
  // console.log(mangas);

  for (let i = 0; i < mangas.length; i++) {
    let mangaExists = await Manga.findOne({ id: mangas[i].manga_id });
    if (!mangaExists) {
      let manga = await nhentai.getDoujin(mangas[i].manga_id);
      if (!manga) {
        console.log("!manga :(");
        return;
      }
      let saveManga = new Manga({
        id: manga.id,
        title: manga.title,
        description: manga.language,
        tags: manga.details.tags,
        telegraph_url: mangas[i].telegraphUrl,
        pages: manga.details.pages,
      });
      if (mangas[i].fixed == 1) {
        telegraph_fixed_url = mangas[i].telegraphUrl;
      }
      saveManga.save(function (err) {
        if (err) return console.error(err);
        console.log("manga saved");
      });

      if (i == mangas.length - 1) {
        console.log(mangas.length + "doujins saved B-)");
      }
      await sleep(1000);
    }
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
/*
{
  _id: { type: String, required: true },
  username: String,
  first_name: String,
  last_name: String,
  language_code: String,
  default_search_sorting: String,
  default_search_type: String,
  favorites: [
    new mongoose.Schema({
      id: Number,
      tags: [String],
    }),
  ],
  manga_history: [Number],
  search_history: [String],
  date: { type: Date, default: Date.now },
}








*/
// migrateUsersTable()
// async function migrateUsersTable() {
//   let users = await db.prepare(`SELECT * FROM users`).all();
//   await db.prepare(`DROP TABLE users;`).run();
//   await db
//     .prepare(
//       `CREATE TABLE IF NOT EXISTS users (
//         user_id INTEGER NOT NULL UNIQUE,
//         fromu TEXT,
//         sort TEXT,
//         search_type TEXT,
//         stage TEXT,
//         settings TEXT
//     );`
//     )
//     .run();
//   for (let i = 0; i < users.length; i++) {
//     let sort = "date",
//       stage = users[i].stage || null;
//     await db
//       .prepare(
//         `INSERT OR IGNORE INTO users
//           (user_id, fromu, sort, stage)
//           VALUES (?, ?, ?, ?);`
//       )
//       .run(users[i].user_id, users[i].fromu, sort, stage);
//   }
//   return;
// }

// migratePosts()
// async function migratePosts() {
//   let telegraphposts = await db.prepare(`SELECT * FROM telegraphposts`).all();
//   await db.prepare(`DROP TABLE telegraphposts;`).run();
//   db.prepare(
//     `CREATE TABLE IF NOT EXISTS telegraphposts (
//         manga_id INT UNIQUE,
//         mangaUrl TEXT UNIQUE,
//         mangaName TEXT,
//         mangaTags TEXT,
//         telegraphUrl TEXT UNIQUE,
//         fixed INT
//     );`
//   ).run();
//   for (let i = 0; i < telegraphposts.length; i++) {
//     let manga = await getDoujin(telegraphposts[i].manga_id);
//     let tags = tagString(manga);
//     await db
//       .prepare(
//         `INSERT OR IGNORE INTO telegraphposts
//           (manga_id, mangaUrl, mangaName, mangaTags, telegraphUrl, fixed)
//           VALUES (?, ?, ?, ?, ?, ?);`
//       )
//       .run(
//         telegraphposts[i].manga_id,
//         telegraphposts[i].mangaUrl,
//         telegraphposts[i].mangaName,
//         tags,
//         telegraphposts[i].telegraphUrl,
//         telegraphposts[i].fixed
//       );
//   }
//   return;
// }

// let botStageStart = JSON.stringify({ zipLoaded: false, doujinsFixing: 0 });

// db.prepare(
//   `INSERT OR IGNORE INTO users
//   (user_id, stage) VALUES (?, ?);`
// ).run("696969696969", botStageStart);

// getBotStage()
async function getBotStage() {
  let id = 696969696969,
    stageString = await db
      .prepare(`SELECT * FROM users WHERE user_id=${id}`)
      .get(),
    stage = JSON.parse(stageString.stage);
  // console.log(stage)
  return stage;
}
async function updateBotStage(property, val) {
  if (!property || val == undefined) {
    return;
  }
  let id = 696969696969,
    oldStage = await getBotStage();
  if (oldStage[property] != undefined) {
    oldStage[property] = val;
  }
  let newStageString = JSON.stringify(oldStage);
  await db
    .prepare(`UPDATE users SET stage = ? WHERE user_id=${id}`)
    .run(newStageString);
}
async function addUser(from) {
  let uid = from.id;
  let fromString = JSON.stringify(from);
  await db
    .prepare(
      `INSERT OR IGNORE INTO users
          (user_id, fromu, sort)
          VALUES (?, ?, ?);`
    )
    .run(uid, fromString, "n");
}

async function saveManga(manga, telegraphUrl) {
  let manga_id = manga.link.slice(22, -1),
    mangaName = manga.title;
  await db
    .prepare(
      `INSERT OR IGNORE INTO telegraphposts 
            (manga_id,
            mangaUrl,
            mangaName,
            telegraphUrl,
            fixed)
          VALUES (?, ?, ?, ?, ?);`
    )
    .run(manga_id, manga.link, mangaName, telegraphUrl, 0);
  console.log("manga: " + mangaName + " - remembered  ");
}
async function getManga(manga_id) {
  let id = typeof manga_id == "string" ? manga_id.toString() : manga_id;
  let manga = await db
    .prepare(`SELECT * FROM telegraphposts WHERE manga_id=${id}`)
    .get();
  return manga;
}
async function updateManga(manga_id, newTelegraphUrl) {
  await db
    .prepare(
      `UPDATE telegraphposts SET
          fixed = 1,
          telegraphUrl = ?
          WHERE manga_id=?`
    )
    .run(newTelegraphUrl, manga_id);
  console.log("updated link for " + manga_id);
}
module.exports = {
  saveManga,
  updateManga,
  getManga,
  updateBotStage,
  getBotStage,
  addUser,
};
