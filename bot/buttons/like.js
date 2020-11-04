const { saveAndGetUser } = require("../../db/saveAndGetUser");
const Manga = require("../../models/manga.model");
const nhentai = require("../../nhentai");

module.exports.likeButton = async function (ctx) {
  let user = await saveAndGetUser(ctx),
    manga_id = ctx.update.callback_query.data.split("_")[1];
  manga = await Manga.findOne({ id: manga_id });
  let keyboard;
  if (ctx.update.callback_query.message) {
    keyboard = ctx.update.callback_query.message.reply_markup.inline_keyboard;
  } else {
    keyboard = [
      [
        { text: "Telegra.ph", url: manga.telegraph_url },
        { text: "🖤", callback_data: "like_" + manga.id },
      ],
    ];
  }
  if (!manga.thumbnail) {
    getManga = await nhentai.getDoujin(manga_id).catch((err) => {
      console.log(err);
    });
    if (!getManga) {
      console.log("!thumbnail");
    } else {
      manga.thumbnail =
        Array.isArray(getManga.thumbnails) && getManga.thumbnails[0]
          ? getManga.thumbnails[0]
          : undefined;
      manga.save();
    }
  }
  if (!user.favorites.id(manga_id)) {
    user.favorites.push({
      _id: manga_id,
      title: manga.title,
      description: manga.description,
      tags: manga.tags,
      pages: manga.pages,
      thumbnail: manga.thumbnail,
      telegraph_url: manga.telegraph_url,
    });

    await user.save();
    console.log("Added to favorites!");
    // keyboard[0].push({ text: "♥️", callback_data: "like_" + manga.id });
    keyboard[0][keyboard[0].length - 1].text = "♥️";
    await ctx
      .answerCbQuery("Added to favorites!")
      .catch((err) => console.log(err));
    await ctx
      .editMessageReplyMarkup({ inline_keyboard: keyboard })
      .catch((err) => console.log(err));
  } else {
    user.favorites.id(manga_id).remove();
    await user.save();
    console.log("Removed from favorites!");
    await ctx
      .answerCbQuery("Removed from favorites!")
      .catch((err) => console.log(err));

    keyboard[0][keyboard[0].length - 1].text = "🖤";
    await ctx
      .editMessageReplyMarkup({ inline_keyboard: keyboard })
      .catch((err) => console.log(err));
  }
  console.log(user.favorites.length);
};
