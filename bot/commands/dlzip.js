const nhentai = require("../../nhentai");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { getMangaMessage } = require("../someFuncs.js");
const fs = require("fs");
const nhdl = require("../../nhentaidownloader");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// there will be no comments here, I do not know how it works
module.exports.dlzip = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  let msg = ctx.message.text,
    mangaId = msg.match(/\d+/) ? msg.match(/\d+/)[0] : null;
  if (!mangaId) {
    await ctx.reply(ctx.i18n.t("zip_tip"), {
      parse_mode: "Markdown",
    }).catch((err)=>{})
    return;
  }
  let manga = await nhentai.getDoujin(mangaId).catch((err) => {
    console.log(err.status);
    return err.status
  });
  if (manga == 404) {
    await ctx.reply(ctx.i18n.t("manga_does_not_exist") + "\n(`" + mangaId+ "`)",{
      parse_mode: "Markdown",
    })
    return;
  }
  if (!manga) {
    await ctx.reply(ctx.i18n.t("failed_to_get") + "\n(`" + mangaId + "`)", {
      parse_mode: "Markdown",
    });
    return;
  }
  if (manga.details.pages > 150) {
    await ctx.reply(ctx.i18n.t("too_many_pages"), {
      parse_mode: "Markdown",
    });
    return;
  }
  await ctx.reply(ctx.i18n.t("waitabit_button"));
  await ctx.replyWithChatAction("upload_document");

  let messageText = getMangaMessage(manga, undefined, ctx.i18n);

  await nhdl(mangaId).then((buffer) => {
    fs.writeFileSync(`./${mangaId}.zip`, buffer);
  }).catch(err=>{
    console.log(err)
    ctx.reply(ctx.i18n.t("something_went_wrong") + "\nError status: " + err.status, {
      parse_mode: "Markdown",
    });
    return;
  });
  await ctx.replyWithChatAction("upload_document");
  let stats = await fs.statSync(`./${mangaId}.zip`),
    fileSizeB = stats["size"],
    fileSizeMB = fileSizeB / 1048576.0;
  console.log(fileSizeMB + " fileSizeMB");
  console.log(fileSizeB + " fileSizeB");

  if (fileSizeMB > 50) {
    await ctx.reply(
      ctx.i18n.t("file_is_too_big") +
      "Your file size: " + fileSizeMB,
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
};