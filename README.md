# nhentai Telegram Bot

A self-hosted Telegram bot for searching, reading, and saving manga — directly inside Telegram.

## Features

- <details>
    <summary>Inline search — search manga in any chat</summary>
    <img src="https://i.postimg.cc/N0pMD78j/image.png" alt="Search">
  </details>
- <details>
    <summary>Favorites — like titles to quickly reopen or share</summary>
    <img src="https://i.postimg.cc/Hk0ZyCCj/Screenshot-from-2020-11-22-21-05-13.png" alt="Favorites">
  </details>
- <details>
    <summary>In-app reading — read manga inside Telegram, no browser needed</summary>
    <img src="https://i.postimg.cc/G36TNCVw/image.png" alt="Instant preview">
  </details>
- <details>
    <summary>Multilingual — available in English, Russian, and Spanish</summary>
    <img src="https://i.postimg.cc/7Zs7Y2hd/image.png" alt="Language selection">
  </details>
- Random discovery — use `/rand` to find something new
- Flexible lookup — open titles by code or link, send multiple codes in one message
- Proxy support — optional FlareSolverr integration to bypass Cloudflare protection

## Prerequisites

- [Bun](https://bun.sh) (for local development)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A writable path for the SQLite database (default: `./data/bot.sqlite`)
- Docker (optional, for FlareSolverr proxy support)

## Installation & Setup

### Local Development
```bash
# 1. Clone the repository
git clone https://github.com/sleroq/nhentai-telegram-bot.git
cd nhentai-telegram-bot

# 2. Install dependencies
bun install

# 3. Copy and fill in environment variables
cp .env.example .env

# 4. Start the bot
bun run preview
```

### Deploy to Replit

[![Run on replit.com](https://replit.com/badge/github/sleroq/nhentai-telegram-bot)](https://replit.com/github/sleroq/nhentai-telegram-bot)

1. Create a free [Replit](https://replit.com/signup) account
2. Fork or import this repository into Replit
3. Set your environment variables in the Replit Secrets panel (see table below)
4. Run the following command once before starting:
```bash
   npm install node && npm install && npm run build
```
5. Click Run

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | ✅ | Your Telegram bot token from @BotFather |
| `DATABASE_PATH` | ✅ | Path to the SQLite database file (default: `./data/bot.sqlite`) |
| `SOURCE_FLARESOLVERR_URL` | ☐ | FlareSolverr endpoint (e.g. `http://127.0.0.1:8191`). Falls back to `FLARESOLVERR_URL`. |
| `SOURCE_PROXY_URL` | ☐ | Upstream proxy passed to FlareSolverr (e.g. `http://127.0.0.1:8888`) |
| `SOURCE_MAX_TIMEOUT_MS` | ☐ | Max timeout for FlareSolverr requests in ms (default: `60000`) |

> Without the FlareSolverr variables set, the bot makes direct HTTP requests to manga sources.

### Running with FlareSolverr (Optional)
```bash
# Start FlareSolverr via Docker
docker run -d --name flaresolverr -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest

# Start the bot with FlareSolverr enabled
SOURCE_FLARESOLVERR_URL=http://127.0.0.1:8191 bun run preview
```

## Contributing

Contributions are welcome. To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a pull request

Please keep PRs focused and include a clear description of what was changed and why.

## Development Progress

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
    - [x] generate webhook urls automatically from built in env variables on [perl.it](http://perl.it)
- [ ] Translations
	- [x] Finish translations in the search
	- [ ] Indonesian
	- [ ] German
- [ ] add actual logging
- [x] proxy support via FlareSolverr for all sources
- [ ] switch from [telegraf](https://github.com/telegraf/telegraf) to [grammy](https://grammy.dev/)
- [x] typescript!
    - [x] inline search
    - [x] random
    - [x] text handler (by code)
    - [x] likes
    - [x] help & settings
    - [x] "fix" button
    - [x] /zip command
- [ ] find alternative for [telegra.ph](http://telegra.ph) and implement as a fallback
- [ ] create new website with fancy stats

## License

This project is open source. See [LICENSE](./LICENSE) for details.