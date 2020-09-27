const nhentai = require("../../nhentai");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { getMangaMessage } = require("../someFuncs.js");
const fs = require("fs");
const nhdl = require("nhentaidownloader");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// there will be no comments here, I do not know how it works
module.exports.dlzip = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  let msg = ctx.message.text,
    mangaId = msg.match(/\d+/) ? msg.match(/\d+/)[0] : null;
  if (!mangaId) {
    await ctx.reply("Yuo have to specify a code: `/zip 234638`", {
      parse_mode: "Markdown",
    });
    return;
  }
  let manga = await nhentai.getDoujin(mangaId).catch((err) => {
    console.log(err.status);
  });
  if (!manga) {
    await ctx.reply("Failed to get doujin `" + mangaId + "` :/", {
      parse_mode: "Markdown",
    });
    return;
  }
  if (manga.details.pages > 100) {
    await ctx.reply("Sorry, that's too many pages :(", {
      parse_mode: "Markdown",
    });
    return;
  }
  await ctx.reply("wait a bit");

  let messageText = getMangaMessage(manga, undefined, ctx.i18n);

  await nhdl(mangaId).then((buffer) => {
    fs.writeFileSync(`./${mangaId}.zip`, buffer);
  });
  let stats = await fs.statSync(`./${mangaId}.zip`),
    fileSizeB = stats["size"],
    fileSizeMB = fileSizeB / 1000000.0;
  console.log(fileSizeMB);

  if (fileSizeMB > 50) {
    await ctx.reply(
      "Sorry, file is too big, for bots telegram allow " +
        "sending files only less then 50 mb, when this file is " +
        fileSizeMB +
        ":(",
      {
        parse_mode: "Markdown",
      }
    );
  } else {
    await ctx.telegram
      .sendDocument(
        ctx.from.id,
        {
          source: fs.readFileSync(`./${mangaId}.zip`),
          filename: `./${mangaId}.zip`,
        },
        {
          caption: messageText,
          parse_mode: "HTML",
        }
      )
      .catch((err) => {
        console.log("reply with file failed :( ", err);
      });
    await ctx.telegram
      .deleteMessage(ctx.from.id, ctx.message.message_id + 1)
      .catch((err) => console.log(err));
  }
  await fs.unlink(`./${mangaId}.zip`, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log(`File ${mangaId}.zip deleted!`);
    }
  });
  // ctx.session.isBotBusy = false;
};

// const nhentai = require("../../nhentai");
// const nhdl = require("nhentaidownloader");

// const { getMangaMessage } = require("../someFuncs.js");
// const { saveAndGetUser } = require("../../db/saveAndGetUser");

// const Manga = require("../../models/manga.model");
// const User = require("../../models/user.model");
// const Message = require("../../models/message.model");

// const fs = require("fs");

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// module.exports.dlzip = async function (ctx) {
//   await saveAndGetUser(ctx);
//   return;
//   let msg = ctx.message.text,
//     manga_id = msg.match(/\d+/) ? msg.match(/\d+/)[0] : null;
//   if (!manga_id) {
//     await ctx.reply("Yuo have to specify a code: `/zip 234638`", {
//       parse_mode: "Markdown",
//     });
//     return;
//   }
//   let manga = await nhentai.getDoujin(manga_id);

//   if (!manga) {
//     await ctx.reply("`" + manga_id + "` does not exist :/", {
//       parse_mode: "Markdown",
//     });
//     return;
//   }
//   if (manga.details.pages > 100) {
//     await ctx.reply("Sorry, that's too many pages :(", {
//       parse_mode: "Markdown",
//     });
//     return;
//   }
//   await ctx.reply("wait a bit");

//   for (let i = 0; ctx.session.botIsZipping; i++) {
//     let messageText;
//     if (i % 2 == 0) {
//       messageText = "you are in a queue, wait a bit.";
//     } else if (i % 3 == 0) {
//       messageText = "you are in a queue, wait a bit...";
//     } else {
//       messageText = "you are in a queue, wait a bit..";
//     }
//     await ctx.telegram
//       .editMessageText(
//         ctx.from.id,
//         ctx.message.message_id + 1,
//         ctx.message.message_id + 1,
//         messageText
//       )
//       .catch((err) => console.log(err));
//     await sleep(2000);
//   }
//   ctx.session.botIsZipping = true;

//   let messageText = getMangaMessage(manga, undefined, ctx.i18n);

//   await nhdl(manga_id).then((buffer) => {
//     fs.writeFileSync(`./${manga_id}.zip`, buffer);
//   });
//   let stats = await fs.statSync(`./${manga_id}.zip`),
//     fileSizeB = stats["size"],
//     fileSizeMB = fileSizeB / 1000000.0;
//   console.log(fileSizeMB);

//   if (fileSizeMB > 50) {
//     await ctx.reply(
//       "Sorry, file is too big, for bots telegram allow " +
//         "sending files only less then 50 mb, when this file is " +
//         fileSizeMB +
//         ":(",
//       {
//         parse_mode: "Markdown",
//       }
//     );
//     ctx.session.botIsZipping = false;
//     await fs.unlink(`./${manga_id}.zip`, function (err) {
//       if (err) {
//         console.log(err);
//       } else {
//         console.log(`File ${manga_id}.zip deleted!`);
//       }
//     });
//     return;
//   } else {
//     await ctx.telegram
//       .sendDocument(
//         ctx.from.id,
//         {
//           source: fs.readFileSync(`./${manga_id}.zip`),
//           filename: `./${manga_id}.zip`,
//         },
//         {
//           caption: messageText,
//           parse_mode: "HTML",
//         }
//       )
//       .catch((err) => {
//         console.log("reply with file failed :( ", err);
//       });
//   }
//   await ctx.telegram
//     .deleteMessage(ctx.from.id, ctx.message.message_id + 1)
//     .catch((err) => console.log(err));
//   await fs.unlink(`./${manga_id}.zip`, function (err) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(`File ${manga_id}.zip deleted!`);
//     }
//   });
//   ctx.session.botIsZipping = false;
// };
