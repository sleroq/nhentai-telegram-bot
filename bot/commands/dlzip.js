const { doujinExists, getDoujin, getMangaMessage } = require("../someFuncs.js");
const fs = require("fs");
const nhdl = require("nhentaidownloader");
const db = require("../../db/dbhandler.js");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.dlzip = async function(ctx) {
  let msg = ctx.message.text,
    mangaId = msg.match(/\d+/) ? msg.match(/\d+/)[0] : null;
  if (!mangaId) {
    await ctx.reply("Yuo have to specify a code: `/zip 234638`", {
      parse_mode: "Markdown"
    });
    return;
  }
  let exists = await doujinExists(mangaId);

  if (!exists) {
    await ctx.reply("`" + mangaId + "` does not exist :/", {
      parse_mode: "Markdown"
    });
    return;
  }
  let manga = await getDoujin(mangaId);
  if (!manga) {
    await ctx.reply("Failed to get doujin `" + mangaId + "` :/", {
      parse_mode: "Markdown"
    });
    return;
  }
  if (manga.details.pages[0] > 100) {
    await ctx.reply("Sorry, that's too many pages :(", {
      parse_mode: "Markdown"
    });
    return;
  }
  await ctx.reply("wait a bit");
  let isBotBusy = await db.getBotStage();

  for (let i = 0; isBotBusy.zipLoaded; i++) {
    let messageText;
    if (i % 2 == 0) {
      messageText = "you are in a queue, wait a bit.";
    } else if (i % 3 == 0) {
      messageText = "you are in a queue, wait a bit...";
    } else {
      messageText = "you are in a queue, wait a bit..";
    }
    await ctx.telegram
      .editMessageText(
        ctx.from.id,
        ctx.message.message_id + 1,
        ctx.message.message_id + 1,
        messageText
      )
      .catch(err => console.log(err));
    isBotBusy = await db.getBotStage();
    await sleep(2000);
  }
  await db.updateBotStage("zipLoaded", true);

  let messageText = getMangaMessage(manga);

  await nhdl(mangaId).then(buffer => {
    fs.writeFileSync(`./${mangaId}.zip`, buffer);
  });
  let stats = await fs.statSync(`./${mangaId}.zip`),
    fileSizeB = stats["size"],
    fileSizeMB = fileSizeB / 1000000.0;
  console.log(fileSizeMB);
  await ctx.telegram
    .deleteMessage(ctx.from.id, ctx.message.message_id + 1)
    .catch(err => console.log(err));
  if (fileSizeMB > 50) {
    await ctx.reply(
      "Sorry, file is too big, for bots telegram allow " +
        "sending files only less then 50 mb, when this file is " +
        fileSizeMB +
        ":(",
      {
        parse_mode: "Markdown"
      }
    );
    return;
  } else {
    await ctx.telegram
      .sendDocument(
        ctx.from.id,
        {
          source: fs.readFileSync(`./${mangaId}.zip`),
          filename: `./${mangaId}.zip`
        },
        {
          caption: messageText,
          parse_mode: "HTML"
        }
      )
      .catch(err => {
        console.log("reply with file failed :( ", err);
      });
  }
  await fs.unlink(`./${mangaId}.zip`, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log(`File ${mangaId}.zip deleted!`);
    }
  });
  await db.updateBotStage("zipLoaded", false);
};
