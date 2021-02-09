const { Schema, model } = require("mongoose");

const mangaSchema = new Schema({
  id: { type: Number, required: true },
  title: String,
  description: String,
  tags: [String],
  pages: Number,
  thumbnail: String,
  telegraph_url: String,
  telegraph_fixed_url: String,
  fixed_pages: [String],
  date: { type: Date, default: Date.now },
});

module.exports = model("Manga", mangaSchema);
