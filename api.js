const mongoose = require('mongoose')
const moment = require("moment");
const Manga = require("./models/manga.model");
const User = require("./models/user.model");
const Message = require("./models/message.model");

function numberWithCommas(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
}

class api {
  static async countManga() {
    const count = await Manga.countDocuments({});
    return {
      count: { number: count, string: numberWithCommas(count) }
    }
  }
  static async countUsers() {
    const count = await User.countDocuments({});
       return {
      count: { number: count, string: numberWithCommas(count) }
    }
  }
  static async countMessages() {
    const count = await Message.countDocuments({});
       return {
      count: { number: count, string: numberWithCommas(count) }
    }
  }
  static async messagesToday() {
    const date_now = moment().format("YYYY-MM-DD");
    const date_tomorrow = moment().add(1, "d").format("YYYY-MM-DD");
    const count = await Message.countDocuments({
      updatedAt: {
        $gte: date_now,
        $lt: date_tomorrow
      }
    });
       return {
      count: { number: count, string: numberWithCommas(count) }
    }
  }
    static async usersToday() {
    const date_now = moment().format("YYYY-MM-DD");
    const date_tomorrow = moment().add(1, "d").format("YYYY-MM-DD");
    const count = await User.countDocuments({
      createdAt: {
        $gte: date_now,
        $lt: date_tomorrow
      }
    });
       return {
      count: { number: count, string: numberWithCommas(count) }
    }
  }
    static async mangaToday() {
    const date_now = moment().format("YYYY-MM-DD");
    const date_tomorrow = moment().add(1, "d").format("YYYY-MM-DD");
    const count = await Manga.countDocuments({
      createdAt: {
        $gte: date_now,
        $lt: date_tomorrow
      }
    });
       return {
      count: { number: count, string: numberWithCommas(count) }
    }
  }
  static async lastManga() {
    const manga = await Manga.findOne({}, {}, { sort: { 'created_at' : -1 } });
       return {
        manga: manga
    }
  }
  static async allinfo() {
    const users = await this.countUsers()
    const doujins = await this.countManga()
    const messagesTotal = await this.countMessages()
    const messagesToday = await this.messagesToday()
    const usersToday = await this.usersToday()
    const mangaToday = await this.mangaToday();
    const lastManga = await this.lastManga();
    return {
      users_total: users.count,
      manga_total: doujins.count,
      messages_total: messagesTotal.count,
      messages_today: messagesToday.count,
      manga_today: mangaToday.count,
      users_today: usersToday.count,
      last_manga: lastManga,
    }
  }
}

module.exports = api;