const nhentai = require("../../nhentai");

const {
  TelegraphUploadByUrls,
  telegraphCreatePage,
} = require("../telegraph.js");
const { getMangaMessage } = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { uploadByUrl } = require("telegraph-uploader");

const Manga = require("../../models/manga.model");
const Message = require("../../models/message.model");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports.fixInstantView = async function (ctx) {
  await saveAndGetUser(ctx);
  let query_data = ctx.update.callback_query.data,
    manga_id = query_data.split("_")[1];
  if (!manga_id) {
    return;
  }
  let manga_db = await Manga.findOne({
    id: manga_id,
  });
  let telegraph_fixed_url = manga_db.telegraph_fixed_url,
    telegraph_url = manga_db.telegraph_url;
  console.log(telegraph_url);
  if (!telegraph_fixed_url) {
    manga = await nhentai.getDoujin(manga_id).catch((err) => {
      console.log(err);
    });
    if (!manga_db) {
      telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
        console.log(err.status);
      });

      manga_db = new Manga({
        id: manga.id,
        title: manga.title,
        description: manga.language,
        telegraph_url: telegraph_url,
        tags: manga.details.tags,
        pages: manga.details.pages,
      });
      manga_db.save();
    }
    let pages = manga.pages,
      telegrapf_urls = [],
      attempts_counter = 0;

    for (let i = 0; i < pages.length; i++) {
      let fixing_keyboard = [[]];
      if (telegraph_url) {
        fixing_keyboard[0].push({
          text: "Telegra.ph",
          url: telegraph_url,
        });
      }
      if (attempts_counter > 9) {
        fixing_keyboard[0].unshift({
          text: ctx.i18n.t("try_again_later"),
          callback_data: "tryLater_" + manga.id,
        });
        await ctx
          .editMessageReplyMarkup({
            inline_keyboard: fixing_keyboard,
          })
          .catch((err) => {
            console.log(err);
          });
        return;
      }
      let new_url = await uploadByUrl(pages[i]).catch(async (err) => {
        console.log(
          "err in uploading image heppened on try number " +
            attempts_counter +
            "\nerr: " +
            err
        );
        i -= 1;
        attempts_counter += 1;
        fixing_keyboard[0].unshift({
          text: "flood wait",
          callback_data: "flood_wait",
        });
        await sleep(5000);
      })
      if(new_url && new_url.link){telegrapf_urls.push(new_url.link)}
      
      fixing_keyboard[0].unshift({
        text: i + 1 + "/" + pages.length + ctx.i18n.t("pages_fixed"),
        callback_data: "fixing",
      });
      await ctx
        .editMessageReplyMarkup({
          inline_keyboard: fixing_keyboard,
        })
        .catch((err) => {
          console.log(err);
        });
    }

    telegraph_fixed_url = await telegraphCreatePage(manga, telegrapf_urls)
      .then((page) => {
        return page.url;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  if (!telegraph_fixed_url) {
    if (ctx.update.callback_query.message) {
      fixing_keyboard[0].push({
        text: "Telegra.ph",
        url: telegraph_url,
      });
      fixing_keyboard[0].unshift({
        text: ctx.i18n.t("previous_button"),
        callback_data: "prev_" + manga.id,
      });
    }
    return;
  }
  manga_db.telegraph_fixed_url = telegraph_fixed_url;
  manga_db.save();
  let messageText = getMangaMessage(manga, telegraph_fixed_url, ctx.i18n),
    inline_keyboard = [
      [
        {
          text: "Telegra.ph",
          url: telegraph_fixed_url,
        },
      ],
    ];
  if (ctx.update.callback_query.message) {
    inline_keyboard.push([
      {
        text: ctx.i18n.t("search_button"),
        switch_inline_query_current_chat: "",
      },
    ]);
    inline_keyboard.push([
      { text: ctx.i18n.t("next_button"), callback_data: "r_prev" + manga.id },
    ]);
    let message = await Message.findOne({
      message_id: ctx.update.callback_query.message.message_id,
      chat_id: ctx.update.callback_query.message.from.id,
    });
    if (message && message.current > 0) {
      inline_keyboard[2].unshift({
        text: ctx.i18n.t("previous_button"),
        callback_data: "prev_" + manga.id,
      });
    }
  }
  console.log(
    "fixed from this - " + telegraph_url + "\nto this - " + telegraph_fixed_url
  );
  await ctx
    .editMessageText(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    })
    .catch((err) => {
      console.log(err);
    });
};
