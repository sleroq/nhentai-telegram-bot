// import moment from 'moment'
// import Manga, { MangaSchema } from './models/manga.model'
// import User from './models/user.model'
// import Message from './models/message.model'

// function numberWithCommas(x: number): string {
//   const parts = x.toString().split('.')
//   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
//   return parts.join(',')
// }

// interface Count {
//   count: {
//     number: number, string: string
//   }
// }

// export default class api {
//   static async countManga(): Promise<Count> {
//     const count = await Manga.countDocuments({})
//     return {
//       count: { number: count, string: numberWithCommas(count) }
//     }
//   }
//   static async countUsers(): Promise<Count> {
//     const count = await User.countDocuments({})
//     return {
//       count: { number: count, string: numberWithCommas(count) }
//     }
//   }
//   static async countMessages(): Promise<Count> {
//     const count = await Message.countDocuments({})
//     return {
//       count: { number: count, string: numberWithCommas(count) }
//     }
//   }
//   static async messagesToday(): Promise<Count> {
//     const date_now = moment().toDate()
//     const date_tomorrow = moment().add(1, 'd').toDate()
//     const count = await Message.countDocuments({
//       updatedAt: {
//         $gte: date_now,
//         $lt:  date_tomorrow
//       }
//     })
//     return {
//       count: { number: count, string: numberWithCommas(count) }
//     }
//   }
//   static async usersToday(): Promise<Count> {
//     const date_now = moment().toDate()
//     const date_tomorrow = moment().add(1, 'd').toDate()
//     const count = await User.countDocuments({
//       createdAt: {
//         $gte: date_now,
//         $lt:  date_tomorrow
//       }
//     })
//     return {
//       count: { number: count, string: numberWithCommas(count) }
//     }
//   }
//   static async mangaToday(): Promise<Count> {
//     const date_now = moment().toDate()
//     const date_tomorrow = moment().add(1, 'd').toDate()
//     const count = await Manga.countDocuments({
//       createdAt: {
//         $gte: date_now,
//         $lt:  date_tomorrow
//       }
//     })
//     return {
//       count: { number: count, string: numberWithCommas(count) }
//     }
//   }
//   static async lastManga(): Promise<{ manga: MangaSchema }|void> {
//     const manga = await Manga.findOne({}, {}, { sort: { _id: -1 } })
//     if(manga){
//       return {
//         manga: manga
//       }
//     }
//   }
//   static async allInfo() {
//     const users = await this.countUsers()
//     const doujins = await this.countManga()
//     const messagesTotal = await this.countMessages()
//     const messagesToday = await this.messagesToday()
//     const usersToday = await this.usersToday()
//     const mangaToday = await this.mangaToday()
//     const lastManga = await this.lastManga()
//     return {
//       users_total:    users.count,
//       manga_total:    doujins.count,
//       messages_total: messagesTotal.count,
//       messages_today: messagesToday.count,
//       manga_today:    mangaToday.count,
//       users_today:    usersToday.count,
//       last_manga:     lastManga,
//     }
//   }
// }