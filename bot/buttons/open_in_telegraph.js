const nhentai = require("../../nhentai");

const { getMangaMessage } = require("../someFuncs.js");
const { TelegraphUploadByUrls } = require("../telegraph.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");

const Manga = require("../../models/manga.model");

module.exports.openiInTelegraph = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  ctx
    .editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: ctx.i18n.t("waitabit_button"), callback_data: "wait" }],
      ],
    })
    .catch((err) => {
      console.log(err);
    });
  let manga_id = ctx.update.callback_query.data.split("_")[1],
    manga = await nhentai.getDoujin(manga_id).catch((er) => {
      if (er.status == 404) {
        console.log(er.satus);
        return;
      }
      console.log(er);
    });
  if (!manga) {
    console.log("!manga");
    return;
  }
  //get manga from database
  let savedManga = await Manga.findOne({ id: manga_id }, function (err) {
    if (err) console.log(err);
  });

  if (!savedManga) {
    //save manga to database if it's not new
    let telegrapfLink = await TelegraphUploadByUrls(manga).catch((err) => {
      console.log(err);
    }); //upload to telegra.ph
  if(!telegrapfLink){
    return
  }
    savedManga = new Manga({
      id: manga_id,
      title: manga.title,
      description: manga.language,
      tags: manga.details.tags,
      telegraph_url: telegrapfLink,
      pages: manga.details.pages,
    });

    savedManga.save(function (err) {
      if (err) return console.error(err);
      console.log("manga saved");
    });
  }
  let telegraph_url = savedManga.telegraph_fixed_url
    ? savedManga.telegraph_fixed_url
    : savedManga.telegraph_url;
  let inline_keyboard = [[{ text: "Telegra.ph", url: telegraph_url }]],
    messageText = getMangaMessage(manga, telegraph_url, ctx.i18n);

  user.manga_history.push(manga.id); //save to history
  user.save();
  /* if the manga is too big, the telegram might refuse to create an instant view,
     so here is a button that can magically fix that */

  let num_of_pages = manga.details ? manga.details.pages : manga.pages;
  if (!manga.telegraph_fixed_url && num_of_pages > 150) {
    inline_keyboard[0].unshift({
      text: ctx.i18n.t("fix_button"),
      callback_data: "fix_" + manga.id,
    });
  }
  await ctx.editMessageText(messageText, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: inline_keyboard,
    },
  });
};
