const nhentai = require("nhentai-js");
const moment = require("moment");
const { uploadByUrl } = require("telegraph-uploader");

const { telegraphCreatePage } = require("../telegraph.js");
const { doujinExists, getDoujin, getMangaMessage } = require("../someFuncs.js");

const db = require("../../db/dbhandler.js");
module.exports.fixInstantView = async function(ctx) {
  let query_data = ctx.update.callback_query.data,
    manga_id = query_data.split("_")[1],
    manga = await getDoujin(manga_id);
  if (!manga) {
    return;
  }
  let dbMangaRecord = await db.getManga(manga_id),
    messageText = getMangaMessage(manga, dbMangaRecord.telegraphUrl);

  await ctx.editMessageReplyMarkup({
    inline_keyboard: [
      [
        { text: "Wait ", callback_data: "wait" },

        {
          text: "Telegra.ph",
          url: dbMangaRecord.telegraphUrl
        }
      ]
    ]
  });
  let start_time = moment();
  console.log("start uploading doujin");
  let pages = manga.pages,
    telegrapf_urls = [],
    attempts_counter = 0;
  // uploading images
  for (let i = 0; i < pages.length; i++) {
    if (attempts_counter > 10) {
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [
          [
            { text: "try again later :(", callback_data: "tryLater" },
            {
              text: "Telegra.ph",
              url: dbMangaRecord.telegraphUrl
            }
          ]
        ]
      });
      return;
    }
    await uploadByUrl(pages[i])
      .then(result => {
        telegrapf_urls.push(result.link);
      })
      .catch(async err => {
        i -= 1;
        console.log(
          "err in uploading image heppened on try number " + attempts_counter
        );
        attempts_counter += 1;
      });
    await ctx
      .editMessageReplyMarkup({
        inline_keyboard: [
          [
            {
              text: i + 1 + "/" + pages.length + " pages fixed",
              callback_data: "fixing"
            },
            {
              text: "Telegra.ph",
              url: dbMangaRecord.telegraphUrl
            }
          ]
        ]
      })
      .catch(err => {
        return;
      });
  }
  console.log("finish uploading images");
  let newPage = await telegraphCreatePage(manga, telegrapf_urls);
  if (newPage.url) {
    console.log("page created");
  } else {
    console.log("page was NOT created");
    return;
  }
  let finish_time = moment(),
    difference_format = manga.details.pages[0] < 20 ? "seconds" : "minutes",
    difference = finish_time.diff(start_time),
    difference_division = difference > 60000 ? 1000 : 60000;
  console.log(
    `it took ${difference / difference_division} ${difference_format}`
  );
  await db.updateManga(manga_id, newPage.url);
  messageText = getMangaMessage(manga, newPage.url);
  let inline_keyboard = [
    [
      {
        text: "Telegra.ph",
        url: newPage.url
      }
    ]
  ];
  if (!ctx.update.callback_query.message) {
    await ctx.editMessageText(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard
      }
    });
  } else {
    inline_keyboard.push([
      { text: "Search", switch_inline_query_current_chat: "" }
    ]);
    inline_keyboard.push([
      { text: "Next", callback_data: "r_prev" + manga.id }
    ]);
    await ctx.editMessageText(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard
      }
    });
  }
};
