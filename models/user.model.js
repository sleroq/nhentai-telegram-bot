const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  username: String,
  first_name: String,
  last_name: String,
  language_code: String,
  default_search_sorting: String,
  default_search_type: String,
  favorites: [
    new mongoose.Schema({
      id: Number,
      tags: [String],
    }),
  ],
  manga_history: [Number],
  search_history: [String],
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
