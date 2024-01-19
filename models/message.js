const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    // conversationId: {type: String},
    sender: { type: mongoose.Schema.Types.ObjectId,
      ref: 'User',},
    receiver: { type: mongoose.Schema.Types.ObjectId,
      ref: 'User',},
    text: {type: String},
    images: [
      {
        path: String,
        filename: String,
      },
    ],
    seen: {type: Boolean, default: false },
    received: {type: Boolean, default: false },
    deleted: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps:true
  });

const Message =new mongoose.model('Message', messageSchema);
module.exports = Message;
