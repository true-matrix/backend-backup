const jwt = require("jsonwebtoken");
const { ObjectId } = require('mongodb');
const otpGenerator = require("otp-generator");
const mailService = require("../services/mailer");
const otp = require("../Templates/Mail/otp");


const AudioCall = require("../models/audioCall");
const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
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
        'firstName',
        'lastName',
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


// exports.getUsers = catchAsync(async (req, res, next) => {
//   const all_users = await User.find({
//     verified: true,
//   }).select("firstName lastName _id");

//   const this_user = req.user;

//   const remaining_users = all_users.filter(
//     (user) =>
//       !this_user.friends.includes(user._id) &&
//       user._id.toString() !== req.user._id.toString()
//   );

//   res.status(200).json({
//     status: "success",
//     data: remaining_users,
//     message: "Users found successfully!",
//   });
// });

exports.getAllVerifiedUsers = catchAsync(async (req, res, next) => {
  const all_users = await User.find({
    verified: true,
  }).select("name _id");

  const remaining_users = all_users.filter(
    (user) => user._id.toString() !== req.user._id.toString()
  );

  res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users found successfully!",
  });
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



// exports.addOmega = catchAsync(async (req, res, next) => {
//   try{
//   const { email, phone } = req.body;

//   const filteredBody = filterObj(
//     req.body,
//     "name",
//     "email",
//     "password",
//     "phone",
//     "gender"
//   );

//   // check if a verified user with given email exists

//   const existing_user = await User.findOne({ email: email });

//   if (existing_user) {
//     // user with this email already exists, Please login
//     return res.status(400).json({
//       status: "error",
//       message: "User already exists",
//     });
//   } else {
//     // if user is not created before than create a new one
//     const new_user = await User.create(filteredBody);
//     return res.status(201).json(new_user);
//     // generate an otp and send to email
//   }}catch (error) {
//       console.error(error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// exports.loginOmega = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;
//   const filteredBody = filterObj(
//     req.body,
//     "email",
//     "password",
//   );

//   if (!email || !password) {
//     res.status(400).json({
//       status: "error",
//       message: "Both email and password are required",
//     });
//     return;
//   }

//   const user = await User.findOne({ email: email }).select("+password");
//   if (!user || !user.password) {
//     res.status(400).json({
//       status: "error",
//       message: "Incorrect password",
//     });

//     return;
//   }

//   // if (!user || !(await user.correctPassword(password, user.password))) {
//   if (!user || user.password !== password) {
//     console.log('omega',user);
//     res.status(400).json({
//       status: "error",
//       message: "Email or password is incorrect",
//     });

//     return;
//   }

//   // const token = signToken(user._id);

//   // res.status(200).json({
//   //   status: "success",
//   //   message: "Logged in successfully!",
//   //   // token,
//   //   // user_id: user._id,
//   // });
//   if (user && (user.password === password)) {

//     await User.findOneAndUpdate({ email: email }, filteredBody, {
//       new: true,
//       validateModifiedOnly: true,
//     });

//     // generate an otp and send to email
//     req.userId = user._id;
//     next();
//   }
// });

// exports.sendOTP = catchAsync(async (req, res, next) => {
//   const { userId } = req;
//   const new_otp = otpGenerator.generate(4, {
//     digits: true,
//     upperCaseAlphabets: false,
//     specialChars: false,
//     lowerCaseAlphabets: false,
//     lowerCaseAlphabets: false, 
//     upperCaseAlphabets: false
//   });

//   const otp_expiry_time = Date.now() + 10 * 60 * 1000; // otp validation : 10 Mins after otp is sent

//   const user = await User.findByIdAndUpdate(userId, {
//     otp_expiry_time: otp_expiry_time,
//   });

//   user.otp = new_otp.toString();

//   await user.save({ new: true, validateModifiedOnly: true });

//   console.log(new_otp);

//   // TODO send mail
//   mailService.sendEmail({
//     from: "rajesh.truematrix@gmail.com",
//     // to: user.email,
//     to: "truematrix@yopmail.com",
//     subject: "Verification OTP",
//     html: otp(user.name, new_otp),
//     attachments: [],
//   });

//   res.status(200).json({
//     status: "success",
//     message: "OTP Sent Successfully!",
//     // email: req?.body?.email,
//     email: user.email,
//   });
// });

// exports.verifyOTP = catchAsync(async (req, res, next) => {
//   // verify otp and update user accordingly
//   const { email, otp } = req.body;
//   const user = await User.findOne({
//     email,
//     otp_expiry_time: { $gt: Date.now() },
//   });

//   if (!user) {
//     return res.status(400).json({
//       status: "error",
//       message: "Email is invalid or OTP expired",
//     });
//   }

//   if (user.verified) {
//     return res.status(400).json({
//       status: "error",
//       message: "Email is already verified",
//     });
//   }

//   // if (!(await user.correctOTP(otp, user.otp))) {
//   if (otp !== user.otp) {

//     res.status(400).json({
//       status: "error",
//       message: "OTP is incorrect",
//     });

//     return;
//   }

//   // OTP is correct

//   user.verified = true;
//   user.otp = undefined;
//   await user.save({ new: true, validateModifiedOnly: true });

//   const token = signToken(user._id);

//   res.status(200).json({
//     status: "success",
//     message: "OTP verified Successfully!",
//     token,
//     user_id: user._id,
//   });
// });

// exports.logout = catchAsync(async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   } else if (req.cookies.jwt) {
//     token = req.cookies.jwt;
//   }
//   if (!token) {
//     console.log("token",token)
//     return res.status(401).json({ message: 'User is already logged out' });
//   }
//   try {
//     const user = jwt.verify(token, process.env.JWT_SECRET);

//     // Assuming user.userId is present in the decoded JWT payload
//     const userId = user.userId;

//     // Update the 'verified' field to false in MongoDB
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: { verified: false } },
//       { new: true } // Return the updated document
//     );

//     // Continue with the next middleware or route handler
//     req.user = updatedUser;
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: 'Unauthorized: Invalid token' });
//   }

  

//   // res.clearCookie("jwt");
//   // res.redirect('/login');
//   res.status(200).json({
//     status: "success",
//     message: "Logout successfully!",
//   });

// })
exports.getUserById = catchAsync(async (req, res, next) => {
  // const all_users = await User.find({
  //   verified: true,
  // }).select("name _id");

  // const this_user = req.user;

  // const remaining_users = all_users.filter(
  //   (user) =>
  //     !this_user.friends.includes(user._id) &&
  //     user._id.toString() !== req.user._id.toString()
  // );
  const { userId } = req.params;
  // const userId = extractUserId(req);
  try {
    const user = await User.findOne({ _id: userId });
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
// exports.getAllVerifiedUsers = catchAsync(async (req, res, next) => {
// let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   } else if (req.cookies.jwt) {
//     token = req.cookies.jwt;
//   }
//   if (!token) {
//     return res.status(401).json({ message: 'User is already logged out!!!' });
//   }

//   let remaining_users;
//   try{
//   const user = jwt.verify(token, process.env.JWT_SECRET);
//     // Assuming user.userId is present in the decoded JWT payload
//     const userId = user.userId;
//     const all_users = await User.find({
//     verified: true,
//   }).select("name gender _id");
//   console.log('all_users',all_users);
//   // console.log('req',req);


//   remaining_users = all_users.filter(
//     (user) => user._id.toString() !== userId
//   );
//   next();
// } catch (error) {
//   return res.status(401).json({ message: 'Unauthorized: Invalid token' });
// }

//   res.status(200).json({
//     status: "success",
//     data: remaining_users,
//     message: "Users found successfully!",
//   });
// });

exports.searchUsers = catchAsync(async (req, res) => {
  const { name } = req.query;

  try {
    const users = await User.find({ name: new RegExp(name, 'i') });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});