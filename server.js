const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

// import mongoose from "mongoose";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// dotenv.config({ path: "./config.env" });
const { attachIoToRequest } = require('./socketManager');

process.on("uncaughtException", (err) => {
  console.log(err);
  console.log("UNCAUGHT Exception! Shutting down ...");
  process.exit(1); // Exit Code 1 indicates that a container shut down, either because of an application failure.
});

const app = require("./app");

// const https = require("https");
const http = require("http");

// const fs = require("fs");


// const options = {
//   key: fs.readFileSync('certificates/key.pem'),
//   cert: fs.readFileSync('certificates/cert.pem'),
// };


const server = http.createServer(app);
// const server = https.createServer(options, app);

// const { Server } = require("socket.io"); // Add this
const { promisify } = require("util");
const User = require("./models/user");
const Message = require("./models/message");
const FriendRequest = require("./models/friendRequest");
const OneToOneMessage = require("./models/OneToOneMessage");
const AudioCall = require("./models/audioCall");
const VideoCall = require("./models/videoCall");

// Add this
// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
// const io = new Server(server, {
//   cors: {
//     // origin: "*",
//     origin: "http://localhost:3000",
//     // origin: 'https://wolf.blutrain.net',
//     methods: ["GET", "POST"],
//   },
// });
// const io = socketIo(server);

// const usp = io.of('/user-namespace');
// usp.on('connection', (socket)=>{
//   console.log('User Contd');
//   socket.on('disconnect', ()=>{
//     console.log('User Discontd');
//   })
// })


const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    // useNewUrlParser: true, // The underlying MongoDB driver has deprecated their current connection string parser. Because this is a major change, they added the useNewUrlParser flag to allow users to fall back to the old parser if they find a bug in the new parser.
    // useCreateIndex: true, // Again previously MongoDB used an ensureIndex function call to ensure that Indexes exist and, if they didn't, to create one. This too was deprecated in favour of createIndex . the useCreateIndex option ensures that you are using the new function calls.
    // useFindAndModify: false, // findAndModify is deprecated. Use findOneAndUpdate, findOneAndReplace or findOneAndDelete instead.
    // useUnifiedTopology: true, // Set to true to opt in to using the MongoDB driver's new connection management engine. You should set this option to true , except for the unlikely case that it prevents you from maintaining a stable connection.
  })
  .then((con) => {
    console.log("DB Connection successful");
  });

const port = process.env.PORT || 8080;

server.listen(port,'0.0.0.0', () => {
  console.log(`App running on port ${port} ...`);
});

//Start Socket
const io = require('socket.io')(server, {
  maxHttpBufferSize: 1e8, // Example buffer size configuration
  // transports: ['websocket'],
  allowUpgrades: false,
  perMessageDeflate: false,
  httpCompression: false,
  maxHttpBufferSize: 1e8,
  cors: {
    // origin: "http://localhost:3000",
    // origin: "https://wolf.blutrain.net",
    origin: "http://wolfpackmessenger.com",
    methods: ["GET", "POST"]
  }
})

let users = [];
const addUser = (userId, socketId) => {
  console.log("userData",userId," socketId",socketId);
  
  !users.some(user => user?.userId == userId ) && users.push({ userId, socketId })
  // users = [...users, { userId, socketId }];
  console.log('users=>',users);
}
const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId);
}
const getUser = (userId) => {
  return users.find(user => user?.userId == userId )
}

io.on("connection",async (socket)=> {
  console.log("Connected to Socket.io");

  // let userId = socket.handshake.auth.userId
  // const objectId =new mongoose.Types.ObjectId(userId);
  // const status =await User.findById(objectId, { _id: 0, verified: 1 });
  // console.log('status',status?.verified);

  // // Send the current verification status to the client when they connect
  // socket.emit('verificationStatus', status?.verified);

  socket.on("setup",async (userId) => {
    if(userId != null){
    socket.join(userId);
    console.log("socket.id=>",socket.id);
    console.log("userId.id=>",userId);
    addUser(userId,socket.id)
    const objectId =new mongoose.Types.ObjectId(userId);
    await User.findByIdAndUpdate({_id: objectId}, {$set:{verified: true}})
    const status =await User.findById(objectId, { _id: 0, verified: 1 });
    socket.emit('verificationStatus', status?.verified);

    // console.log("userId",userId);
    socket.emit("connected")
    io.emit('getUsers',users)
  }
  })



  // socket.on("join chat", (room) => {
  //   socket.join(room);
  //   console.log("User Joined Room: " + room);
  // })
  const createRoomId = (userId1, userId2) => {
    const sortedUserIds = [userId1, userId2].sort();
    return sortedUserIds.join('-');
  };
    // Handle the "join chat" event
    socket.on('join chat', ({ senderId, receiverId }) => {
      // const room = `${senderId}-${receiverId}`;
      const room = createRoomId(senderId, receiverId);
  
      // Join the chat room
      socket.join(room);
  
      // console.log(`User ${socket.id} joined chat room: ${room}`);
    });

    socket.on("leave chat", async ({ senderId, receiverId }) => {
      const room = createRoomId(senderId, receiverId);
      socket.leave(room);
  
      // console.log(`User ${socket.id} left chat room: ${room}`);
    });

  socket.on("new message", (formData)=>{
    console.log('new message',formData);
    const user = getUser(formData?.receiver?._id)
    // const room = createRoomId(formData?.sender?._id, formData?.receiver?._id);
    socket.to(user?.socketId).emit("message received", formData)
    socket.to(user?.socketId).emit("getNotification",{
      senderId : formData?.sender?._id,
      isRead: false,
      date: new Date()
      })
  })

  socket.on('deleteMessage', async (messageId) => {
    try {
      // Perform the deletion logic here...
      const existingMessage = await Message.findById(messageId);

      if (!existingMessage) {
        // If the message doesn't exist, notify the client
        return io.to(socket.id).emit('messageDeleteError', 'Message not found');
      }

      // Perform the deletion by setting the 'deleted' field to true
      existingMessage.deleted = true;
      await existingMessage.save();

      // Notify all connected clients about the deleted message
      io.emit('messageDeleted', messageId);
    } catch (error) {
      console.error(error);

      // If there's an error during deletion, notify the client
      io.to(socket.id).emit('messageDeleteError', 'Internal server error');
    }
  });

  // // Handle event when a user reads a message
  // socket.on('messageRead', async (data) => {
  //   // Assuming data includes the sender and receiver user IDs
  //   const { senderUserId, receiverUserId } = data;

  //   // Update the unread message count to 0 in your database
  //   // You may use your database model to update the unreadMessagesCounts

  //   // Example using Mongoose:
  //   await Message.updateMany(
  //     { sender: senderUserId, receiver: receiverUserId, seen: false },
  //     { $set: { seen: true } }
  //   );

  //   // Emit an event to update the unread message count on the client side
  //   io.emit('updateUnreadCount', { userId: senderUserId, unreadCount: 0 });
  // });


  //Disconnect
  socket.on("disconnect",async()=>{
    let userId = socket.handshake.auth.userId
    const objectId =new mongoose.Types.ObjectId(userId);
    await User.findByIdAndUpdate({_id: objectId}, {$set:{verified: false}})
    removeUser(socket.id);
    let status =await User.findById(objectId, { _id: 0, verified: 1 });
    socket.emit('verificationStatus', status?.verified);
    io.emit('getUsers', users);
  })

})

// io.on("connection", async (socket) => {
//   const user_id = socket.handshake.query["user_id"];
//     console.log('User Connected :',user_id);

//     // socket.on("incoming-message",(data)=>{
//     //   socket.join(data)
//     // })

//     socket.on("disconnect", ()=>{
//       console.log('User Disconnected', socket.io);
//     })
// })
// Add this
// Listen for when the client connects via socket.io-client
// io.on("connection", async (socket) => {
//   console.log(JSON.stringify(socket.handshake.query));
//   const user_id = socket.handshake.query["user_id"];

//   console.log(`User connected ${socket.id}`);

//   // socket.on("welcome",socket.id)

//   if (user_id != null && Boolean(user_id)) {
//     try {
//       User.findByIdAndUpdate(user_id, {
//         socket_id: socket.id,
//         status: "Online",
//       });
//     } catch (e) {
//       console.log(e);
//     }
//   }

//   // We can write our socket event listeners in here...
//   socket.on("friend_request", async (data) => {
//     const to = await User.findById(data.to).select("socket_id");
//     const from = await User.findById(data.from).select("socket_id");

//     // create a friend request
//     await FriendRequest.create({
//       sender: data.from,
//       recipient: data.to,
//     });
//     // emit event request received to recipient
//     io.to(to?.socket_id).emit("new_friend_request", {
//       message: "New friend request received",
//     });
//     io.to(from?.socket_id).emit("request_sent", {
//       message: "Request Sent successfully!",
//     });
//   });

//   socket.on("accept_request", async (data) => {
//     // accept friend request => add ref of each other in friends array
//     console.log(data);
//     const request_doc = await FriendRequest.findById(data.request_id);

//     console.log(request_doc);

//     const sender = await User.findById(request_doc.sender);
//     const receiver = await User.findById(request_doc.recipient);

//     sender.friends.push(request_doc.recipient);
//     receiver.friends.push(request_doc.sender);

//     await receiver.save({ new: true, validateModifiedOnly: true });
//     await sender.save({ new: true, validateModifiedOnly: true });

//     await FriendRequest.findByIdAndDelete(data.request_id);

//     // delete this request doc
//     // emit event to both of them

//     // emit event request accepted to both
//     io.to(sender?.socket_id).emit("request_accepted", {
//       message: "Friend Request Accepted",
//     });
//     io.to(receiver?.socket_id).emit("request_accepted", {
//       message: "Friend Request Accepted",
//     });
//   });

//   socket.on("get_direct_conversations", async ({ user_id }, callback) => {
//     const existing_conversations = await OneToOneMessage.find({
//       participants: { $all: [user_id] },
//     }).populate("participants", "name avatar _id email status");

//     // db.books.find({ authors: { $elemMatch: { name: "John Smith" } } })

//     console.log(existing_conversations);

//     callback(existing_conversations);
//   });

//   socket.on("start_conversation", async (data) => {
//     // data: {to: from:}

//     const { to, from } = data;

//     // check if there is any existing conversation

//     const existing_conversations = await OneToOneMessage.find({
//       participants: { $size: 2, $all: [to, from] },
//     }).populate("participants", "name _id email status");

//     console.log(existing_conversations[0], "Existing Conversation");

//     // if no => create a new OneToOneMessage doc & emit event "start_chat" & send conversation details as payload
//     if (existing_conversations.length === 0) {
//       let new_chat = await OneToOneMessage.create({
//         participants: [to, from],
//       });

//       new_chat = await OneToOneMessage.findById(new_chat).populate(
//         "participants",
//         "name _id email status"
//       );

//       console.log(new_chat);

//       socket.emit("start_chat", new_chat);
//     }
//     // if yes => just emit event "start_chat" & send conversation details as payload
//     else {
//       socket.emit("start_chat", existing_conversations[0]);
//     }
//   });

//   socket.on("get_messages", async (data, callback) => {
//     try {
//       const { messages } = await OneToOneMessage.findById(
//         data.conversation_id
//       ).select("messages");
//       callback(messages);
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   // Handle incoming text/link messages
//   socket.on("text_message", async (data) => {
//     console.log("Received message:", data);

//     // data: {to, from, text}

//     const { message, conversation_id, from, to, type } = data;

//     const to_user = await User.findById(to);
//     const from_user = await User.findById(from);

//     // message => {to, from, type, created_at, text, file}

//     const new_message = {
//       to: to,
//       from: from,
//       type: type,
//       created_at: Date.now(),
//       text: message,
//     };

//     // fetch OneToOneMessage Doc & push a new message to existing conversation
//     const chat = await OneToOneMessage.findById(conversation_id);
//     chat.messages.push(new_message);
//     // save to db`
//     await chat.save({ new: true, validateModifiedOnly: true });

//     // emit incoming_message -> to user

//     io.to(to_user?.socket_id).emit("new_message", {
//       conversation_id,
//       message: new_message,
//     });

//     // emit outgoing_message -> from user
//     io.to(from_user?.socket_id).emit("new_message", {
//       conversation_id,
//       message: new_message,
//     });
//   });

//   // handle Media/Document Message
//   socket.on("file_message", (data) => {
//     console.log("Received message:", data);

//     // data: {to, from, text, file}

//     // Get the file extension
//     const fileExtension = path.extname(data.file.name);

//     // Generate a unique filename
//     const filename = `${Date.now()}_${Math.floor(
//       Math.random() * 10000
//     )}${fileExtension}`;

//     // upload file to AWS s3

//     // create a new conversation if its dosent exists yet or add a new message to existing conversation

//     // save to db

//     // emit incoming_message -> to user

//     // emit outgoing_message -> from user
//   });

//   // -------------- HANDLE AUDIO CALL SOCKET EVENTS ----------------- //

//   // handle start_audio_call event
//   socket.on("start_audio_call", async (data) => {
//     const { from, to, roomID } = data;

//     const to_user = await User.findById(to);
//     const from_user = await User.findById(from);

//     console.log("to_user", to_user);

//     // send notification to receiver of call
//     io.to(to_user?.socket_id).emit("audio_call_notification", {
//       from: from_user,
//       roomID,
//       streamID: from,
//       userID: to,
//       userName: to,
//     });
//   });

//   // handle audio_call_not_picked
//   socket.on("audio_call_not_picked", async (data) => {
//     console.log(data);
//     // find and update call record
//     const { to, from } = data;

//     const to_user = await User.findById(to);

//     await AudioCall.findOneAndUpdate(
//       {
//         participants: { $size: 2, $all: [to, from] },
//       },
//       { verdict: "Missed", status: "Ended", endedAt: Date.now() }
//     );

//     // TODO => emit call_missed to receiver of call
//     io.to(to_user?.socket_id).emit("audio_call_missed", {
//       from,
//       to,
//     });
//   });

//   // handle audio_call_accepted
//   socket.on("audio_call_accepted", async (data) => {
//     const { to, from } = data;

//     const from_user = await User.findById(from);

//     // find and update call record
//     await AudioCall.findOneAndUpdate(
//       {
//         participants: { $size: 2, $all: [to, from] },
//       },
//       { verdict: "Accepted" }
//     );

//     // TODO => emit call_accepted to sender of call
//     io.to(from_user?.socket_id).emit("audio_call_accepted", {
//       from,
//       to,
//     });
//   });

//   // handle audio_call_denied
//   socket.on("audio_call_denied", async (data) => {
//     // find and update call record
//     const { to, from } = data;

//     await AudioCall.findOneAndUpdate(
//       {
//         participants: { $size: 2, $all: [to, from] },
//       },
//       { verdict: "Denied", status: "Ended", endedAt: Date.now() }
//     );

//     const from_user = await User.findById(from);
//     // TODO => emit call_denied to sender of call

//     io.to(from_user?.socket_id).emit("audio_call_denied", {
//       from,
//       to,
//     });
//   });

//   // handle user_is_busy_audio_call
//   socket.on("user_is_busy_audio_call", async (data) => {
//     const { to, from } = data;
//     // find and update call record
//     await AudioCall.findOneAndUpdate(
//       {
//         participants: { $size: 2, $all: [to, from] },
//       },
//       { verdict: "Busy", status: "Ended", endedAt: Date.now() }
//     );

//     const from_user = await User.findById(from);
//     // TODO => emit on_another_audio_call to sender of call
//     io.to(from_user?.socket_id).emit("on_another_audio_call", {
//       from,
//       to,
//     });
//   });

//   // --------------------- HANDLE VIDEO CALL SOCKET EVENTS ---------------------- //

//   // handle start_video_call event
//   socket.on("start_video_call", async (data) => {
//     const { from, to, roomID } = data;

//     console.log(data);

//     const to_user = await User.findById(to);
//     const from_user = await User.findById(from);

//     console.log("to_user", to_user);

//     // send notification to receiver of call
//     io.to(to_user?.socket_id).emit("video_call_notification", {
//       from: from_user,
//       roomID,
//       streamID: from,
//       userID: to,
//       userName: to,
//     });
//   });

//   // handle video_call_not_picked
//   socket.on("video_call_not_picked", async (data) => {
//     console.log(data);
//     // find and update call record
//     const { to, from } = data;

//     const to_user = await User.findById(to);

//     await VideoCall.findOneAndUpdate(
//       {
//         participants: { $size: 2, $all: [to, from] },
//       },
//       { verdict: "Missed", status: "Ended", endedAt: Date.now() }
//     );

//     // TODO => emit call_missed to receiver of call
//     io.to(to_user?.socket_id).emit("video_call_missed", {
//       from,
//       to,
//     });
//   });

//   // handle video_call_accepted
//   socket.on("video_call_accepted", async (data) => {
//     const { to, from } = data;

//     const from_user = await User.findById(from);

//     // find and update call record
//     await VideoCall.findOneAndUpdate(
//       {
//         participants: { $size: 2, $all: [to, from] },
//       },
//       { verdict: "Accepted" }
//     );

//     // TODO => emit call_accepted to sender of call
//     io.to(from_user?.socket_id).emit("video_call_accepted", {
//       from,
//       to,
//     });
//   });

//   // handle video_call_denied
//   socket.on("video_call_denied", async (data) => {
//     // find and update call record
//     const { to, from } = data;

//     await VideoCall.findOneAndUpdate(
//       {
//         participants: { $size: 2, $all: [to, from] },
//       },
//       { verdict: "Denied", status: "Ended", endedAt: Date.now() }
//     );

//     const from_user = await User.findById(from);
//     // TODO => emit call_denied to sender of call

//     io.to(from_user?.socket_id).emit("video_call_denied", {
//       from,
//       to,
//     });
//   });

//   // handle user_is_busy_video_call
//   socket.on("user_is_busy_video_call", async (data) => {
//     const { to, from } = data;
//     // find and update call record
//     await VideoCall.findOneAndUpdate(
//       {
//         participants: { $size: 2, $all: [to, from] },
//       },
//       { verdict: "Busy", status: "Ended", endedAt: Date.now() }
//     );

//     const from_user = await User.findById(from);
//     // TODO => emit on_another_video_call to sender of call
//     io.to(from_user?.socket_id).emit("on_another_video_call", {
//       from,
//       to,
//     });
//   });

//   // -------------- HANDLE SOCKET DISCONNECTION ----------------- //

//   socket.on("end", async (data) => {
//     // Find user by ID and set status as offline

//     if (data.user_id) {
//       await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
//     }

//     // broadcast to all conversation rooms of this user that this user is offline (disconnected)

//     console.log("closing connection");
//     socket.disconnect(0);
//   });
// });

process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("UNHANDLED REJECTION! Shutting down ...");
  server.close(() => {
    process.exit(1); //  Exit Code 1 indicates that a container shut down, either because of an application failure.
  });
});
