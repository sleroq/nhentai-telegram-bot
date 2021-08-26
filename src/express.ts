import config from '../config'

import express from 'express'

const expressApp = express()
import api from './api.js'
import cors from 'cors'
import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'

export default async function startWithWebhook(bot: Telegraf<Context<Update>>, token: string): Promise<void> {
  const port = process.env.PORT || 3000,
    domain = process.env.REPL_URL || process.env.HEROKU_URL
  const secretPath = `/telegraf/${Math.random().toString(36).substring(7)}`

  await bot.telegram.setWebhook(`${domain}${secretPath}`, {
    drop_pending_updates: true,
  })

  // Set the bot API endpoint
  expressApp.use(bot.webhookCallback(secretPath))

  expressApp.get('/', (req, res) => { res.send(config.express_get_slash) })

  // for api with statistics (./api.js):
  if (config.api_enabled) {
    expressApp.use(cors())

    expressApp.get('/api/countManga', async (req, res) => {
      const answer = await api.countManga()
      res.send(answer)
    })
    expressApp.get('/api/countUsers', async (req, res) => {
      const answer = await api.countUsers()
      res.send(answer)
    })
    expressApp.get('/api/countMessages', async (req, res) => {
      const answer = await api.countMessages()
      res.send(answer)
    })
    expressApp.get('/api/messagesToday', async (req, res) => {
      const answer = await api.messagesToday()
      res.send(answer)
    })
    expressApp.get('/api/mangaToday', async (req, res) => {
      const answer = await api.mangaToday()
      res.send(answer)
    })
    expressApp.get('/api/usersToday', async (req, res) => {
      const answer = await api.usersToday()
      res.send(answer)
    })
    expressApp.get('/api/lastManga', async (req, res) => {
      const answer = await api.lastManga()
      res.send(answer)
    })
    expressApp.get('/api', async (req, res) => {
      const answer = await api.allInfo()
      res.send(answer)
    })
  }
  expressApp.listen(port, () => {
    console.log(`Bot is running on port ${port}`)
  })
}