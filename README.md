# Features:

- <details>
    <summary>
      Inline search - search manga in any chat.
    </summary>
    <img src="https://i.postimg.cc/N0pMD78j/image.png" alt="Search">
  </details>
- <details>
    <summary>
      Favorites - like the manga so you can easily open or share it.
    </summary>
    <img src="https://i.postimg.cc/Hk0ZyCCj/Screenshot-from-2020-11-22-21-05-13.png" alt="Favorites">
  </details>
- <details>
    <summary>
      Read manga directly in the telegram app, no need to open a browser.
    </summary>
    <img src="https://i.postimg.cc/G36TNCVw/image.png" alt="Instant preview">
  </details>
- Discover new doujins with /rand command.
- Open doujins using code or link, send multiple codes in one message.
- <details>
    <summary>
      Database - Bot works even if nhentai is down (more than 500k doujins are saved).
    </summary>
    <img src="https://i.imgur.com/eh69bTA.png" alt="Database screnshot">
  </details>
- <details>
    <summary>
      Translated into Russian and Spanish
    </summary>https://i.imgur.com/eh69bTA.png
    <img src="https://i.postimg.cc/7Zs7Y2hd/image.png" alt="Language selection">
  </details>

## One-Click Deploy Button
### Pre-reqs for deploying this project to Heroku or Repl.it:

- Create [Heroku](https://signup.heroku.com/) or [Replit](https://replit.com/signup) account (free)
- Create cluster on [Mongo database](https://docs.atlas.mongodb.com/getting-started/) (free)
- Get bot token from [@BotFather](https://t.me/BotFather)

On repl.it you may need to run `npm install node && npm install && npm run build` before starting for the first time

[![Run on Repl.it](https://repl.it/badge/github/sleroq/nhentai-telegram-bot)](https://repl.it/github/sleroq/nhentai-telegram-bot)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/sleroq/nhentai-telegram-bot)

## Development progress:

- [ ] User-related features
	- [ ] ability to set filter and random only in specific tags
	- [ ] ability to exclude tags from random
	- [ ] button to delete all user data in settings
	- [ ] button to clear history in settings
	- [ ] redesign settings
	- [x] add answerCallbackQuery() to prevent infinite loading on buttons
- [ ] instance features
    - [ ] support for readonly connection with database
    - [x] ability to connect to multiple databases
    - [x] generate webhook urls automatically from built in env variables on [perl.it](http://perl.it) and [heroku](https://www.heroku.com/)
- [ ] Tanslations
	- [x] Finish translations in the search
	- [ ] Indonesian
	- [ ] German
- [ ] add actual logging
- [ ] proxy
- [ ] switch from [telegraf](https://github.com/telegraf/telegraf) to [grammy](https://grammy.dev/)
- [x] typescript!
    - [x] inline search
    - [x] random
    - [x] text handler (by code)
    - [x] likes
    - [x] help & settings
    - [x] "fix" button
    - [x] /zip command
- [ ] find alternative for [telegra.ph](http://telegra.ph) and implement as a fallback (for hosting images)
- [ ] create new website with fancy stats