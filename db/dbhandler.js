const Database = require("better-sqlite3");
const db = new Database("./db/memory.db", { verbose: console.log });

// db.prepare(`DROP TABLE users;`).run()
db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER NOT NULL UNIQUE,
      fromu TEXT,
      sort TEXT,
      search_type TEXT,
      stage TEXT,
      settings TEXT
  );`
).run();
migrateUsersTable()
async function migrateUsersTable() {
  let users = await db
      .prepare(`SELECT * FROM users`)
      .all()
  await db.prepare(`DROP TABLE users;`).run()
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER NOT NULL UNIQUE,
        fromu TEXT,
        sort TEXT,
        search_type TEXT,
        stage TEXT,
        settings TEXT
    );`
  ).run();
  for(let i=0; i<users.length; i++){
    let sort = 'date',
        stage = users[i].stage || null
    await db
    .prepare(
      `INSERT OR IGNORE INTO users
          (user_id, fromu, sort, stage)
          VALUES (?, ?, ?, ?);`
    )
    .run(users[i].user_id, users[i].fromu, sort, stage);
  }
  return
}
db.prepare(
  `CREATE TABLE IF NOT EXISTS telegraphposts (
      manga_id INT,
      mangaUrl TEXT UNIQUE,
      mangaName TEXT,
      telegraphUrl TEXT UNIQUE,
      fixed INT
  );`
).run();

let botStageStart = JSON.stringify({ zipLoaded: false, doujinsFixing: 0 });

db.prepare(
  `INSERT OR IGNORE INTO users
  (user_id, stage) VALUES (?, ?);`
).run("696969696969", botStageStart);

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
    .prepare(
      `UPDATE users SET stage = ? WHERE user_id=${id}`
    )
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
  addUser
};
