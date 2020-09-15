const nhentai = require("../../nhentai");

const { TelegraphUploadByUrls } = require("../telegraph.js");
const { getMangaMessage } = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { uploadByUrl } = require("telegraph-uploader");

const Manga = require("../../models/manga.model");
const Message = require("../../models/message.model");

module.exports.fixInstantView = async function (ctx) {
  await saveAndGetUser(ctx);
  let query_data = ctx.update.callback_query.data,
    manga_id = query_data.split("_")[1];
  if (!manga_id) {
    return;
  }
  let message = await Message.findOne({
    message_id: ctx.update.callback_query.message.message_id,
    chat_id: ctx.update.callback_query.message.from.id,
  });
  let current = message ? message.history[message.current] : manga_id;

  let manga = await Manga.findOne({
    id: current,
  });
  let telegraph_url = manga.telegraph_url,
    telegraph_fixed_url;
  if (!manga.telegraph_fixed_url) {
    getManga = await nhentai.getDoujin(manga_id);
    if (!manga) {
      telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
        console.log(err.status);
      });

      manga = new Manga({
        id: getManga.id,
        title: getManga.title,
        description: getManga.language,
        telegraph_url: telegraph_url,
        tags: getManga.details.tags,
        pages: getManga.details.pages,
      });
    }
    let pages = getManga.pages,
      telegrapf_urls = [],
      attempts_counter = 0;

    for (let i = 0; i < pages.length; i++) {
      fixing_keyboard = [[]];
      if (telegraph_url) {
        fixing_keyboard[0].push({
          text: "Telegra.ph",
          url: telegraph_url,
        });
      }
      if (attempts_counter > 3) {
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
      });
      telegrapf_urls.push(new_url);
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

    telegraph_fixed_url = await telegraphCreatePage(
      getManga,
      telegrapf_urls
    ).then((page) => {
      return page.url;
    });
  } else {
    telegraph_fixed_url = manga.telegraph_fixed_url;
  }

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
