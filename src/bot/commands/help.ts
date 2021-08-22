import config from '../../../config'
import i18n from '../../lib/i18n'

import { CallbackQuery, InlineKeyboardButton} from 'telegraf/typings/core/types/typegram'
import { Context } from 'telegraf'
import Verror from 'verror'

const helpKeyboard: InlineKeyboardButton[][] = [
  [
    {
      text:          i18n.t('search_tips_button'),
      callback_data: 'searchtips',
    },
  ],
  [
    {
      text:                             i18n.t('tap_to_open_favorites'),
      switch_inline_query_current_chat: '',
    },
  ],
  [
    {
      text:                             i18n.t('tap_to_open_history'),
      switch_inline_query_current_chat: '/h',
    },
  ],
]

export default async function help(ctx: Context): Promise<void> {
  let help_text = i18n.t('help')
  if (config.donation_wallets != '') {
    help_text += '\n' + i18n.t('donation_message') + config.donation_wallets
  }
  if ('callback_query' in ctx.update) {
    try {
      await ctx.editMessageText(help_text, {
        parse_mode:               'HTML',
        disable_web_page_preview: true,
        reply_markup:             {
          inline_keyboard: helpKeyboard
        },
      })
    } catch (error) {
      throw new Verror(error, 'Editing help')
    }
  } else {
    try {
      await ctx.reply(help_text, {
        parse_mode:               'HTML',
        disable_web_page_preview: true,
        reply_markup:             {
          inline_keyboard: helpKeyboard
        },
      })
    } catch (error) {
      throw new Verror(error, 'Replying with help')
    }
  }
}

export async function editHelp(ctx: Context, query: CallbackQuery.DataCallbackQuery): Promise<void> {
  const message = i18n.t('search_tips')
  const inlineKeyboard = [
    [
      {
        text: i18n.t('back_button'),
        callback_data: 'helpsearchback',
      },
      {
        text: i18n.t('search'),
        switch_inline_query_current_chat: '',
      },
    ],
  ]
  try {
    await ctx.editMessageText(message, {
      parse_mode:               'HTML',
      disable_web_page_preview: true,
      reply_markup:             {
        inline_keyboard: inlineKeyboard
      },
    })
  } catch (error) {
    throw new Verror(error, 'Editing help')
  }
}
