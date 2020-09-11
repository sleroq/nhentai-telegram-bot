const user = new Schema({
  _id: { type: String, required: true },
  username: String,
  first_name: String,
  date: { type: Date, default: Date.now },
});

module.exports = model("User", user);
