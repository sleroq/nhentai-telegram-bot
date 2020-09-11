const express = require("express");
const expressApp = express();

function startListen(bot, PORT) {
  const port = PORT || 3000;

  bot.telegram.setWebhook(process.env.REPL_URL + "/secret-path");
  expressApp.use(bot.webhookCallback("/secret-path"));
  expressApp.get("/", (req, res) => {
    res.send("Hello, love <3");
  });
  expressApp.listen(port, () => {
    console.log(`Our app is running on port ${port}`);
  });
}

module.exports = {
  startListen,
};
