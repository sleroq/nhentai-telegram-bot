import got, { Response } from 'got'
import Doujin from './doujin.js'

import cheerio, { CheerioAPI } from 'cheerio'

export default class eHentai {
  static async getDoujin(id: string): Promise<Doujin> {
    let response: Response<string> | undefined
    try {
      response = await got(`https://nhentai.net/g/${id}/`)
    } catch (error) {
      const e = getError(error)

      if (e.message === 'Response code 404 (Not Found)') {
        throw new Error('Not found')
      }
      throw e
    }
    // return assembleDoujin(response)
  }

}

function getError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  } else {
    throw new Error('Error is not an instance of Error: ' + error)
  }
}
