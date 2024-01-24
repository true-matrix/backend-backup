const mongoose = require("mongoose");

// Define Group Message schema
const groupMessageSchema = new mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    images: [
      {
        path: String,
        filename: String,
      },
    ],
    },
    {
      timestamps:true
    });

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
module.exports = GroupMessage;
