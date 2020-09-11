const messageSchema = new Schema({
  chat_id: { type: String, required: true },
  message_id: { type: Number, required: true },
  history: [Number],
  date: { type: Date, default: Date.now },
});

module.exports = model("Message", messageSchema);
