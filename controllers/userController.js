const jwt = require("jsonwebtoken");
const { ObjectId } = require('mongodb');
const otpGenerator = require("otp-generator");
const mailService = require("../services/mailer");
const otp = require("../Templates/Mail/otp");


const AudioCall = require("../models/audioCall");
const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const Message = require("../models/message");
const VideoCall = require("../models/videoCall");
const catchAsync = require("../utils/catchAsync");
const filterObj = require("../utils/filterObj");
const multer = require('multer');

const { generateToken04 } = require("./zegoServerAssistant");


const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);
// Please change appID to your appId, appid is a number
// Example: 1234567890
const appID = process.env.ZEGO_APP_ID; // type: number

// Please change serverSecret to your serverSecret, serverSecret is string
// Example：'sdfsdfsd323sdfsdf'
const serverSecret = process.env.ZEGO_SERVER_SECRET; // type: 32 byte length string

const  extractUserId = (req) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return res.status(401).json({ message: 'User is already logged out!!!' });
  }

  const user = jwt.verify(token, process.env.JWT_SECRET);
  return user.userId;
}


exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: req.user,
  });
});

// exports.updateMe = catchAsync(async (req, res, next) => {
//   const filteredBody = filterObj(
//     req.body,
//     "firstName",
//     "lastName",
//     "about",
//     "phone",
//     "avatar"
//   );

//   const userDoc = await User.findByIdAndUpdate(req.user._id, filteredBody);

//   res.status(200).json({
//     status: "success",
//     data: userDoc,
//     message: "User Updated successfully",
//   });
// });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
 
const upload = multer({ storage: storage });

exports.updateMe = catchAsync(async (req, res, next) => {
  try {
    // Use the 'upload' middleware to handle the file
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: 'error',
          message: 'File upload failed',
        });
      }

      // Filter the body properties
      const filteredBody = filterObj(
        req.body,
        'name',
        'about',
        'phone'
      );

      // If a file is uploaded, update the avatar property
      if (req.file) {
        filteredBody.avatar = `https://backend-api-0pbl.onrender.com/uploads/${req.file.filename}`;
      }

      // Update the user document
      const userDoc = await User.findByIdAndUpdate(req.user._id, filteredBody);

      res.status(200).json({
        status: 'success',
        data: userDoc,
        message: 'User updated successfully',
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});


exports.getRequests = catchAsync(async (req, res, next) => {
  const requests = await FriendRequest.find({ recipient: req.user._id })
    .populate("sender")
    .select("_id firstName lastName");

  res.status(200).json({
    status: "success",
    data: requests,
    message: "Requests found successfully!",
  });
});

exports.getFriends = catchAsync(async (req, res, next) => {
  const this_user = await User.findById(req.user._id).populate(
    "friends",
    "_id firstName lastName"
  );
  res.status(200).json({
    status: "success",
    data: this_user.friends,
    message: "Friends found successfully!",
  });
});

/**
 * Authorization authentication token generation
 */

exports.generateZegoToken = catchAsync(async (req, res, next) => {
  try {
    const { userId, room_id } = req.body;

    console.log(userId, room_id, "from generate zego token");

    const effectiveTimeInSeconds = 3600; //type: number; unit: s; token expiration time, unit: second
    const payloadObject = {
      room_id, // Please modify to the user's roomID
      // The token generated allows loginRoom (login room) action
      // The token generated in this example allows publishStream (push stream) action
      privilege: {
        1: 1, // loginRoom: 1 pass , 0 not pass
        2: 1, // publishStream: 1 pass , 0 not pass
      },
      stream_id_list: null,
    }; //
    const payload = JSON.stringify(payloadObject);
    // Build token
    const token = generateToken04(
      appID * 1, // APP ID NEEDS TO BE A NUMBER
      userId,
      serverSecret,
      effectiveTimeInSeconds,
      payload
    );
    res.status(200).json({
      status: "success",
      message: "Token generated successfully",
      token,
    });
  } catch (err) {
    console.log(err);
  }
});

exports.startAudioCall = catchAsync(async (req, res, next) => {
  const from = req.user._id;
  const to = req.body.id;

  const from_user = await User.findById(from);
  const to_user = await User.findById(to);

  // create a new call audioCall Doc and send required data to client
  const new_audio_call = await AudioCall.create({
    participants: [from, to],
    from,
    to,
    status: "Ongoing",
  });

  res.status(200).json({
    data: {
      from: to_user,
      roomID: new_audio_call._id,
      streamID: to,
      userID: from,
      userName: from,
    },
  });
});

exports.startVideoCall = catchAsync(async (req, res, next) => {
  const from = req.user._id;
  const to = req.body.id;

  const from_user = await User.findById(from);
  const to_user = await User.findById(to);

  // create a new call videoCall Doc and send required data to client
  const new_video_call = await VideoCall.create({
    participants: [from, to],
    from,
    to,
    status: "Ongoing",
  });

  res.status(200).json({
    data: {
      from: to_user,
      roomID: new_video_call._id,
      streamID: to,
      userID: from,
      userName: from,
    },
  });
});

exports.getCallLogs = catchAsync(async (req, res, next) => {
  const user_id = req.user._id;

  const call_logs = [];

  const audio_calls = await AudioCall.find({
    participants: { $all: [user_id] },
  }).populate("from to");

  const video_calls = await VideoCall.find({
    participants: { $all: [user_id] },
  }).populate("from to");

  console.log(audio_calls, video_calls);

  for (let elm of audio_calls) {
    const missed = elm.verdict !== "Accepted";
    if (elm.from._id.toString() === user_id.toString()) {
      const other_user = elm.to;

      // outgoing
      call_logs.push({
        id: elm._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    } else {
      // incoming
      const other_user = elm.from;
// outgoing
      call_logs.push({
        id: elm._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    }
  }

  for (let element of video_calls) {
    const missed = element.verdict !== "Accepted";
    if (element.from._id.toString() === user_id.toString()) {
      const other_user = element.to;

      // outgoing
      call_logs.push({
        id: element._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    } else {
      // incoming
      const other_user = element.from;

      // outgoing
      call_logs.push({
        id: element._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Call Logs Found successfully!",
    data: call_logs,
  });
});


exports.getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // const userId = extractUserId(req);
  try {
    const user = await User.findOne({ _id: id });
    console.log('user',user);
    if (user) {
      res.status(200).json({
        status: 'success',
        data: user,
        message: 'User found successfully!',
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
  } catch (error) {
    console.error('Error getting user by userId', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});
exports.getAllVerifiedUsers = catchAsync(async (req, res, next) => {
let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return res.status(401).json({ message: 'User is already logged out!!!' });
  }

  let remaining_users;
  try{
  const user = jwt.verify(token, process.env.JWT_SECRET);
    // Assuming user.userId is present in the decoded JWT payload
    const userId = user.userId;
    const all_users = await User.find({
    verified: true,
  }).select("name gender _id");
  console.log('all_users',all_users);
  // console.log('req',req);


  remaining_users = all_users.filter(
    (user) => user._id.toString() !== userId
  );
  next();
} catch (error) {
  return res.status(401).json({ message: 'Unauthorized: Invalid token' });
}

  res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users found successfully!",
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      return res.status(401).json({ message: 'User is already logged out!!!' });
    }
  
    let remaining_users;
    try{
    const user = jwt.verify(token, process.env.JWT_SECRET);
      // Assuming user.userId is present in the decoded JWT payload
      const userId = user.userId;
      const all_users = await User.find();

    //   const all_users = await User.find({
    //   verified: true,
    // }).select("name gender _id");
    // console.log('all_users',all_users);
    // console.log('req',req);
  
  
    remaining_users = all_users.filter(
      (user) => user._id.toString() !== userId
    );
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
  
    res.status(200).json({
      status: "success",
      data: remaining_users,
      message: "Users found successfully!",
    });
  });

// exports.getAllChattingUsers = catchAsync(async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.cookies.jwt) {
//     token = req.cookies.jwt;
//   }

//   if (!token) {
//     return res.status(401).json({ message: 'User is already logged out!!!' });
//   }

//   try {
//     const user = jwt.verify(token, process.env.JWT_SECRET);
//     const userId = user.userId;

//     const messages = await Message.find({
//       $or: [{ sender: userId }, { receiver: userId }],
//     });
//     console.log('mmsg',messages);

//     // Extract unique user IDs from messages
//     const userIds = [...new Set(messages.map(message => [message.sender, message.receiver]).flat())];

    
//      // Fetch users excluding the current user
//      const users = await User.find({ _id: { $in: userIds, $ne: userId } });
//     console.log('chatting-users',users);
//     res.status(200).json({
//       status: 'success',
//       data: users,
//       message: 'Users found successfully!',
//     });
//   } catch (error) {
//     return res.status(401).json({ message: 'Unauthorized: Invalid token' });
//   }
//   });
// exports.getAllChattingUsers = catchAsync(async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.cookies.jwt) {
//     token = req.cookies.jwt;
//   }

//   if (!token) {
//     return res.status(401).json({ message: 'User is already logged out!!!' });
//   }

//   try {
//     const user = jwt.verify(token, process.env.JWT_SECRET);
//     const userId = user.userId;

//     const messages = await Message.find({
//       $or: [{ sender: userId }, { receiver: userId }],
//     });

//     // Extract unique user IDs from messages
//     const userIds = [...new Set(messages.map(message => [message.sender, message.receiver]).flat())];

//     // Fetch users excluding the current user
//     const users = await User.find({ _id: { $in: userIds, $ne: userId } });

//     // Prepare an object to store the last sent text by sender
//     const lastSentTexts = {};

//     // Count of unread messages
//     let unreadMessagesCount = 0;

//     // Iterate through messages to find the last sent text by each sender and count unread messages
//     messages.forEach(message => {
//       const otherUserId = message.sender.equals(userId) ? message.receiver : message.sender;
//       if (!lastSentTexts[otherUserId] || message.createdAt > lastSentTexts[otherUserId].createdAt) {
//         lastSentTexts[otherUserId] = {
//           text: message.text,
//           createdAt: message.createdAt,
//         };
//       }
//       // Count unread messages
//       if (!message.seen) {
//         unreadMessagesCount++;
//       }
//     });

//     // Add last sent text and unread messages count to each user in the response
//     // const usersWithLastSentText = users.map(user => ({
//     //   ...user._doc,
//     //   lastSentText: lastSentTexts[user._id] ? lastSentTexts[user._id].text : null,
//     //   unreadMessagesCount: unreadMessagesCount,
//     // }));
//     const usersWithLastSentText = users.map(user => ({
//       ...user._doc,
//       lastSentText: lastSentTexts[user._id] ? lastSentTexts[user._id].text : null,
//       lastSentTextTime: lastSentTexts[user._id] ? lastSentTexts[user._id].createdAt.toISOString() : null,
//       unreadMessagesCount: unreadMessagesCount,
//     }));

//     console.log('chatting-users', usersWithLastSentText);
//     res.status(200).json({
//       status: 'success',
//       data: usersWithLastSentText,
//       message: 'Users found successfully!',
//     });
//   } catch (error) {
//     return res.status(401).json({ message: 'Unauthorized: Invalid token' });
//   }
// });
exports.getAllChattingUsers = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ message: 'User is already logged out!!!' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userId = user.userId;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    // Extract unique user IDs from messages
    const userIds = [...new Set(messages.map(message => [message.sender, message.receiver]).flat())];

    // Fetch users excluding the current user
    const users = await User.find({ _id: { $in: userIds, $ne: userId } });

    // Prepare an object to store the last sent text by sender
    const lastSentTexts = {};

    // Prepare an object to store unread messages count for each user
    const unreadMessagesCounts = {};

    // Iterate through messages to find the last sent text by each sender and count unread messages
    messages.forEach(message => {
      const otherUserId = message.sender.equals(userId) ? message.receiver : message.sender;
       // Count only the receiver's unseen messages
       if (message.receiver.equals(userId) && !message.seen) {
        unreadMessagesCounts[otherUserId] = (unreadMessagesCounts[otherUserId] || 0) + 1;
      }
      if (!lastSentTexts[otherUserId] || message.createdAt > lastSentTexts[otherUserId].createdAt) {
        lastSentTexts[otherUserId] = {
          text: message.text,
          createdAt: message.createdAt,
        };
      }
    });

    // Add last sent text and unread messages count to each user in the response
    const usersWithLastSentText = users.map(user => ({
      ...user._doc,
      lastSentText: lastSentTexts[user._id] ? lastSentTexts[user._id].text : null,
      lastSentTextTime: lastSentTexts[user._id] ? lastSentTexts[user._id].createdAt.toISOString() : null,
      unreadMessagesCount: unreadMessagesCounts[user._id] || 0,
    }));
    // Sort usersWithLastSentText based on lastSentTextTime in descending order
    usersWithLastSentText.sort((a, b) => new Date(b.lastSentTextTime) - new Date(a.lastSentTextTime));

    console.log('chatting-users', usersWithLastSentText);
    res.status(200).json({
      status: 'success',
      data: usersWithLastSentText,
      message: 'Users found successfully!',
    });
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
});

exports.resetUnreadMessagesCount = catchAsync(async (req, res, next) => {
  try {
    const { userId, friendId } = req.body;

    // Implement logic to reset unreadMessagesCount in your database
    // For example, using Mongoose:
    await Message.updateMany(
      { sender: friendId, receiver: userId, seen: false },
      { $set: { seen: true } }
    );

    // Respond with success
    res.status(200).json({ status: 'success', message: 'Unread count reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});  

exports.searchUsers = catchAsync(async (req, res) => {
  const { name } = req.query;

  try {
    const users = await User.find({ name: new RegExp(name, 'i') });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to update a user by admin
exports.updateUser = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.userId; // Assuming you have a route parameter for the user _id

    const updateFields = filterObj(
      req.body,
      'name',
      'email',
      'password',
      'phone',
      'gender'
    );

    // Check if the user with the given _id exists
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Update the user fields
    Object.assign(existingUser, updateFields);

    // Save the updated user
    const updatedUser = await existingUser.save();

    return res.status(200).json({
      status: 'success',
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

