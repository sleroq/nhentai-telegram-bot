const { createConnection } = require("mongoose");

const connection = createConnection(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: true,
});

connection.then(() => {
  console.log("DB connected");
});

connection.catch((e) => {
  console.log("DB error", e);
});
