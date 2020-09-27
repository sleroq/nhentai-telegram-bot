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
  // get manga from db
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

  if (!telegraph_fixed_url) {
    // get magna from nhentai because db don't habe pages array
    manga = await nhentai.getDoujin(manga_id).catch((err) => {
      console.log(err);
    });
    // save manga if it's not already
    if (!manga_db) {
      //if this fix fails we will atleast have prev url
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
      telegraph_urls = [],
      attempts_counter = 0; // coun't retries because err

    // incase it isn't the first try to fix manga we nont want to reupload same pages
    if (Array.isArray(manga_db.fixed_pages) || manga_db.fixed_pages.length) {
      telegraph_urls = uniq(manga_db.fixed_pages); // so get them from db
      console.log(
        "here is " + telegraph_urls.length + " pages from previous fix"
      );
    }

    for (let i = telegraph_urls.length || 0; i < pages.length; i++) {
      let fixing_keyboard = [[]];
      if (telegraph_url) {
        // while manga is fixing you can still try to open broken one:
        fixing_keyboard[0].push({
          text: "Telegra.ph",
          url: telegraph_url,
        });
      }
      // incase we were retrying after err 10 times - stop it
      if (attempts_counter > 9) {
        fixing_keyboard[0].unshift({
          // button to try again:
          text: ctx.i18n.t("try_again_later"),
          callback_data: "fixLater_" + manga.id,
        });
        // incase it happen not in inline search we should add buttons back:
        if (ctx.update.callback_query.message) {
          fixing_keyboard.push([
            {
              text: ctx.i18n.t("search_button"),
              switch_inline_query_current_chat: "",
            },
          ]);
          fixing_keyboard.push([
            {
              text: ctx.i18n.t("next_button"),
              callback_data: "r_prev" + manga.id,
            },
          ]);
          let message_db = await Message.findOne({
            message_id: ctx.update.callback_query.message.message_id,
            chat_id: ctx.update.callback_query.message.from.id,
          });
          if (message_db && message_db.current > 0) {
            fixing_keyboard[2].unshift({
              text: ctx.i18n.t("previous_button"),
              callback_data: "prev_" + manga.id,
            });
          }
        }

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
          text: "flood wait err",
          callback_data: "flood_wait",
        });

        await sleep(5000); // idk if it helps
      });

      if (new_url && new_url.link) {
        telegraph_urls.push(new_url.link);
        manga_db.fixed_pages.push(new_url.link); // if err, we won't lose pages
        await manga_db.save(); // hope there is no limits on the number of requests
      }

      // display the process:
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

    telegraph_fixed_url = await telegraphCreatePage(manga, telegraph_urls)
      .then((page) => {
        return page.url;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // if there is no url somehow, prevent err, and allow user to return
  if (!telegraph_fixed_url) {
    fixing_keyboard[0].push({
      text: "Telegra.ph",
      url: telegraph_url,
    });
    if (ctx.update.callback_query.message) {
      fixing_keyboard[0].unshift({
        text: ctx.i18n.t("previous_button"),
        callback_data: "prev_" + manga.id,
      });
    }
    await ctx
      .editMessageReplyMarkup({
        inline_keyboard: fixing_keyboard,
      })
      .catch((err) => {
        console.log(err);
      });
    return;
  }
  // save new url ofcourse:
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

function uniq(a) {
  var seen = {};
  return a.filter(function (item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}
