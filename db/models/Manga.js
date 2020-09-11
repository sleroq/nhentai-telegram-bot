const mangaSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: String,
  description: String,
  tags: [String],
  telegraph_url: String,
  telefraph_fixed_url: String,
});

module.exports = model("Manga", mangaSchema);
