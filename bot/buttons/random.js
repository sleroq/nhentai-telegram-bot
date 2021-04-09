const nhentai = require("../../nhentai");

const {
  getMangaMessage,
} = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { saveAndGetManga } = require("../../db/saveAndGetManga");

const Message = require("../../models/message.model");

module.exports.randomButton = async function (ctx) {
  let user = await saveAndGetUser(ctx);

  let message = await Message.findOne({
    message_id: ctx.update.callback_query.message.message_id,
    chat_id: ctx.update.callback_query.message.from.id,
  });

  /* if something breaks (nhentai is down)
     user still can go back to prev opend mangas: */
  let waiting_keyboard = [
    [{
      text: ctx.i18n.t("previous_button"),
      callback_data: "prev_",
    },
    { text: ctx.i18n.t("waitabit_button"), callback_data: "wait" }],
  ];
  ctx
    .editMessageReplyMarkup({
      inline_keyboard: waiting_keyboard,
    })
    .catch((err) => {
      console.log(err);
    });

  if (!message) {
    message = new Message({
      chat_id: ctx.update.callback_query.message.from.id,
      message_id: ctx.update.callback_query.message.message_id,
      current: 0,
      history: [],
    });
  } else {
    message.current += 1;
  }

  let manga, telegraph_url;

  /* if user previously was clicking back button and he is not at the and of history
      [ 234, 123, 345, 1243, 356]  - history.length==5
             usr                    (current==1)
  */
  if (message.current < message.history.length) {
    manga = await saveAndGetManga(message.history[message.current]);
    if (!manga || manga == 404) {
      ctx.reply("couldn't get manga")
      console.log("couldn't get manga so return")

      return
    }
    /* if user at the end of history and looking for new manga:
        [ 234, 123, 345, 1243, 356]  - history.length==5
                               usr     (current==4)
    */
  } else {
    manga = await saveAndGetManga(undefined, user);
    if (!manga || manga == 404) {
      ctx.reply("couldn't get manga")
      console.log("couldn't get manga so return")

      return
    }
    message.history.push(manga.id);
    if (message.history.length > 50) {
      // (i have only 500mb bro stop)
      for (let t = message.history.length; t > 50; t--) {
        message.history.shift();
      }
    }
  }

  user.manga_history.push(manga.id);
  if (user.manga_history.length > 50) {
    // you don't need so much history, do you?
    for (let t = user.manga_history.length; t > 50; t--) {
      user.manga_history.shift();
    }
  }
  message.save();
  user.save();

  telegraph_url = manga.telegraph_fixed_url
    ? manga.telegraph_fixed_url
    : manga.telegraph_url;

  let messageText = getMangaMessage(manga, telegraph_url, ctx.i18n),
    heart = user.favorites.id(manga.id) ? "♥️" : "🖤";
  inline_keyboard = [
    [
      { text: "Telegra.ph", url: telegraph_url },
      { text: heart, callback_data: "like_" + manga.id },
    ],
    [
      {
        text: ctx.i18n.t("search_button"),
        switch_inline_query_current_chat: "",
      },
    ],
    [{ text: ctx.i18n.t("next_button"), callback_data: "r_" + manga.id }],
  ];

  // in db number of pages in 'pages' var, but in nhentai it's in 'details.pages':
  let num_of_pages = manga.details ? manga.details.pages : manga.pages;
  /* for those who click buttons without any reason
     show fix button only if there is really a lot of pages: */
  if (!manga.telegraph_fixed_url && num_of_pages > 150) {
    inline_keyboard[0].unshift({
      text: ctx.i18n.t("fix_button"),
      callback_data: "fix_" + manga.id,
    });
  }
  if (message.current > 0) {
    inline_keyboard[2].unshift({
      text: ctx.i18n.t("previous_button"),
      callback_data: "prev_" + manga.id,
    });
  }
  // finally!
  await ctx
    .editMessageText(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    })
    .catch((err) => {
      console.log(err.code);
    });
};
