const { doujinExists, getDoujin, getMangaMessage } = require("../someFuncs.js");
const fs = require("fs");
const nhdl = require("nhentaidownloader");

module.exports.dlzip = async function(ctx) {
  let msg = ctx.message.text,
    mangaId = msg.match(/\d+/) ? msg.match(/\d+/)[0] : null;
    if(!mangaId){return}
  let exists = await doujinExists(mangaId);

  if (!exists) {
    ctx.reply("`" + mangaId + "` does not exist :/", {
      parse_mode: "Markdown"
    });
    return;
  }
  let manga = await getDoujin(mangaId);
  if (!manga) {
    ctx.reply("Failed to get doujin `" + mangaId + "` :/", {
      parse_mode: "Markdown"
    });
    return;
  }
  let messageText = getMangaMessage(manga);

  await nhdl(mangaId).then(buffer => {
    fs.writeFileSync(`./${mangaId}.zip`, buffer);
  });
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
  await fs.unlink(`./${mangaId}.zip`, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log(`File ${mangaId}.zip deleted!`);
    }
  });
};
