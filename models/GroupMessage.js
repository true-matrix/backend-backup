const mongoose = require("mongoose");

// Define Group schema
const groupMessageSchema = new mongoose.Schema({
    groupname: {type: String},
    description: {type: String},
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // admin: { type: Object, ref: 'User' },
    // members: [{ type: Object, ref: 'User' }],
  },
  {
    timestamps:true
  });
  
  const GroupMessage =new mongoose.model('GroupMessage', groupMessageSchema);
  module.exports = GroupMessage;