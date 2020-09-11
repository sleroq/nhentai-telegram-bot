const { Schema, model } = require("mongoose");

const mangaSchema = new Schema({
  id: { type: Number, required: true },
  title: String,
  description: String,
  tags: [String],
  pages: Number,
  telegraph_url: String,
  telegraph_fixed_url: String,
});

module.exports = model("Manga", mangaSchema);
