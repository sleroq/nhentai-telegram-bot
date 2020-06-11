const Database = require("better-sqlite3");
const db = new Database("./db/memory.db", { verbose: console.log });

db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER NOT NULL UNIQUE,
      fromu TEXT,
      lastRandom TEXT,
      lastManga TEXT,
      stage TEXT,
      sort TEXT
      settings TEXT
  );`
).run();
// db.prepare(`DROP TABLE users;`).run()
db.prepare(
  `CREATE TABLE IF NOT EXISTS telegraphposts (
      manga_id INT,
      mangaUrl TEXT UNIQUE,
      mangaName TEXT,
      telegraphUrl TEXT UNIQUE,
      fixed INT
  );`
).run();

async function addUser(from) {
  let uid = from.id;
  let fromString = JSON.stringify(from);
  await db
    .prepare(
      `INSERT OR IGNORE INTO users
  (user_id, fromu, sort) VALUES (?, ?, ?);`
    )
    .run(uid, fromString, "n");
}

async function saveManga(manga, telegraphUrl) {
  let manga_id = manga.link.slice(22, -1),
    mangaName = manga.title;
  await db
    .prepare(
      `INSERT OR IGNORE INTO telegraphposts
(manga_id, mangaUrl, mangaName, telegraphUrl, fixed) VALUES (?, ?, ?, ?, ?);`
    )
    .run(manga_id, manga.link, mangaName, telegraphUrl, 0);
  console.log("manga: " + mangaName + " - remembered  ");
}

async function getManga(manga_id) {
  let manga = await db
    .prepare(`SELECT * FROM telegraphposts WHERE manga_id=${manga_id}`)
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
  addUser
};
