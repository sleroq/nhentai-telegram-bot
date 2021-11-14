# nhentai telegram bot

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
- Database - Bot works even if nhentai is down (more than 170k doujins are saved).
- <details>
    <summary>
      Translated into Russian and Spanish
    </summary>
    <img src="https://i.postimg.cc/7Zs7Y2hd/image.png" alt="Language selection">
  </details>

## One-Click Deploy Button
Since I'm currently working on a complete transition to typescript, **not all the functionality works yet**<br>
Does not work in new version yet:
* 'fix' button (For fixing telegra.ph links without 'Instant View' button)

if you want an old version, then use the code from the latest javascript release<br>
### Pre-reqs for deploying this project to Heroku or Repl.it:

- Create [Heroku](https://signup.heroku.com/) or [Replit](https://replit.com/signup) account (free)
- Create cluster on [Mongo database](https://docs.atlas.mongodb.com/getting-started/) (free)
- Get bot token from [@BotFather](https://t.me/BotFather)

On repl.it you may need to run `npm install node && npm install && npm run build` before starting for the first time

[![Run on Repl.it](https://repl.it/badge/github/iamdowner/nhentai-telegram-bot)](https://repl.it/github/iamdowner/nhentai-telegram-bot)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/iamdowner/nhentai-telegram-bot)
