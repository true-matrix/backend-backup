// const mongoose = require("mongoose");

// // Define Group Message schema
// const groupMessageSchema = new mongoose.Schema({
//     group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
//     sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     message: { type: String },
//     images: [
//       {
//         path: String,
//         filename: String,
//       },
//     ],
//     },
//     {
//       timestamps:true
//     });

// const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
// module.exports = GroupMessage;


const mongoose = require("mongoose");

// Define Group Message schema
const groupMessageSchema = new mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String },
    images: [
        {
            path: String,
            filename: String,
        },
    ],
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of users who have seen the message
}, {
    timestamps: true
});

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
module.exports = GroupMessage;


