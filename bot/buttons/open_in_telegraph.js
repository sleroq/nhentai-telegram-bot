const nhentai = require("../../nhentai");

const { getMangaMessage, isFullColor } = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { saveAndGetManga } = require("../../db/saveAndGetManga");


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
  let savedManga = await saveAndGetManga(manga_id)
        if(!manga){
                console.log("couldn't get manga so return")

      ctx.reply("couldn't get manga")
      return
    }
  let telegraph_url = savedManga.telegraph_fixed_url
    ? savedManga.telegraph_fixed_url
    : savedManga.telegraph_url;

  let heart = user.favorites.id(manga_id) ? "♥️" : "🖤",
    inline_keyboard = [
      [
        { text: "Telegra.ph", url: telegraph_url },
        { text: heart, callback_data: "like_" + manga_id },
      ],
    ],
    messageText = getMangaMessage(manga, telegraph_url, ctx.i18n);

  user.manga_history.push(manga.id); //save to history
  user.save();
  /* if the manga is too big, the telegram might refuse to create an instant view,
     so here is a button that can magically fix that */
  let num_of_pages = manga.details ? manga.details.pages : manga.pages;
  let isFullColor = isFullColor(manga);
  if (!manga.telegraph_fixed_url &&
    (num_of_pages > 150 || isFullColor)) {
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
