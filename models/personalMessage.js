const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    conversationId: {type: String},
    sender_id: {type: String},
    receiver_id: {type: String},
    text: {type: String},
    image: {type: String},
    seen: {type: String},
    received: {type: String},
  },
  {
    timestamps:true
  });

const PersonalMessage =new mongoose.model('PersonalPersonalMessage', messageSchema);
module.exports = PersonalMessage;
