const mongoose = require("mongoose");

// Define Group schema
const createGroupSchema = new mongoose.Schema({
    groupname: {type: String},
    description: {type: String},
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps:true
  });
  
  const Group =new mongoose.model('Group', createGroupSchema );
  module.exports = Group ; 