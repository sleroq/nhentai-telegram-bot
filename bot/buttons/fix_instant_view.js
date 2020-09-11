const nhentai = require("../../nhentai");

const { TelegraphUploadByUrls } = require("../telegraph.js");
const { getMangaMessage } = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");

const Manga = require("../../models/manga.model");
const Message = require("../../models/message.model");

module.exports.fixInstantView = async function (ctx) {
  let user = await saveAndGetUser(ctx);
  let query_data = ctx.update.callback_query.data,
    manga_id = query_data.split("_")[1];
  if (!manga_id) {
    return;
  }

  let manga = await Manga.findOne({
    id: message.history[message.current],
  });

  if (!manga) {
    getManga = await getDoujin(manga_id); //get manga

    telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
      console.log(typeof err);
      console.log(err);
    });
    let manga = new Manga({
      id: manga.id,
      title: manga.title,
      description: manga.language,
      tags: manga.details.tags,
      telegraph_url: telegraph_url,
      pages: manga.details.pages,
    });
  } else {
    telegraph_url = manga.telegrapf_url;
  }
  if (telegraph_url) {
    await ctx
      .editMessageReplyMarkup({
        inline_keyboard: [
          [
            { text: ctx.i18n.t("waitabit_button"), callback_data: "wait" },

            {
              text: "Telegra.ph",
              url: telegraph_url,
            },
          ],
        ],
      })
      .catch((err) => {
        console.log(err);
      });
  }

  let pages = manga.pages,
    telegrapf_urls = [],
    attempts_counter = 0,
    fixing_keyboard = [
      [
        {
          text: "Telegra.ph",
          url: telegraph_fixed_url,
        },
      ],
    ];

  for (let i = 0; i < pages.length; i++) {
    if (attempts_counter > 3) {
      await ctx
        .editMessageReplyMarkup({
          inline_keyboard: fixing_keyboard[0].unshift({
            text: ctx.i18n.t("try_again_later"),
            callback_data: "tryLater_" + manga.id,
          }),
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
    });
    telegrapf_urls.push(new_url);
    await ctx
      .editMessageReplyMarkup({
        inline_keyboard: fixing_keyboard[0].unshift({
          text: i + 1 + "/" + pages.length + ctx.i18n("pages_fixed"),
          callback_data: "fixing",
        }),
      })
      .catch((err) => {
        console.log(err);
      });
  }
  if (!telegraph_fixed_url) {
    return;
  }

  let telegraph_fixed_url = await telegraphCreatePage(
    manga,
    telegrapf_urls
  ).then((page) => {
    return page.url;
  });
  if (!telegraph_fixed_url) {
    return;
  }
  manga.telegraph_fixed_url = telegraph_fixed_url;
  manga.save();
  messageText = getMangaMessage(manga, newPage.url);
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
      [
        {
          text: ctx.i18n.t("search_button"),
          switch_inline_query_current_chat: "",
        },
      ],
      [{ text: ctx.i18n.t("next_button"), callback_data: "r_prev" + manga.id }],
    ]);
    let message = await Message.findOne({
      message_id: ctx.update.callback_query.message.message_id,
      chat_id: ctx.update.callback_query.message.from.id,
    });
    if (message.current > 0) {
      inline_keyboard[2].unshift({
        text: ctx.i18n.t("previous_button"),
        callback_data: "prev_" + manga.id,
      });
    }
  }
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
