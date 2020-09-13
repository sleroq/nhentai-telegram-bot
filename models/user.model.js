const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  username: String,
  first_name: String,
  last_name: String,
  language_code: String,

  search_sorting: String,
  search_type: String,

  empty_query: String,
  default_search_query: String,

  random_localy: Boolean,
  can_repeat_in_random: Boolean,
  ignored_random_tags: [String],
  default_random_tags: [String],

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
