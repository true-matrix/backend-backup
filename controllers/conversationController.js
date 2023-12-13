const jwt = require("jsonwebtoken");
const Conversation = require("../models/conversation");
const catchAsync = require("../utils/catchAsync");

// New Conversation
// exports.newConversation = catchAsync(async (req, res, next) => {
//     const newConversation = new Conversation({
//         members : [req.body.senderId, req.body.receiverId]
//       })
//     try {
//       const saveConversation = await newConversation.save();
//       res.status(200).json({
//         status: 'success',
//         data: saveConversation,
//         message: 'New conversation started',
//       })
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({
//         status: 'error',
//         message: 'Internal server error',
//       });
//     }
//   });

// exports.newConversation = catchAsync(async (req, res, next) => {
//   const senderId = req.body.senderId;
//   const receiverId = req.body.receiverId;

//   // Check if a conversation already exists
//   const existingConversation = await Conversation.findOne({
//     members: {
//       $all: [senderId, receiverId],
//     },
//   });

//   if (existingConversation) {
//     // Redirect to the existing conversation
//     return res.status(200).json({
//       status: 'success',
//       data: existingConversation,
//       message: 'Existing conversation found',
//     });
//   }

//   // If no existing conversation, create a new one
//   const newConversation = new Conversation({
//     members: [senderId, receiverId],
//   });

//   try {
//     const savedConversation = await newConversation.save();
//     res.status(200).json({
//       status: 'success',
//       data: savedConversation,
//       message: 'New conversation started',
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//     });
//   }
// });

exports.newConversation = catchAsync(async (req, res, next) => {
  const senderId = req.body.senderId;
  const receiverId = req.body.receiverId;

  // Check if a conversation already exists
  const existingConversation = await Conversation.findOne({
    members: { $all: [{ $elemMatch: { $eq: senderId } }, { $elemMatch: { $eq: receiverId } }] },
  });

  if (existingConversation) {
    // Redirect to the existing conversation
    return res.status(200).json({
      status: 'success',
      data: existingConversation,
      message: 'Existing conversation found',
    });
  }

  // If no existing conversation, create a new one
  const newConversation = new Conversation({
    members: [senderId, receiverId],
  });

  try {
    const savedConversation = await newConversation.save();
    res.status(200).json({
      status: 'success',
      data: savedConversation,
      message: 'New conversation started',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});




// Get Conversation of a user
exports.getConversation = catchAsync(async (req, res, next) => {
  // const authUserId = req.user._id;
  // const authIdString = authUserId.toString();
  // const uId = req.params.userId
  // let senderId = "";
  // console.log('authUserId',authUserId);
  // console.log('uId',uId);
  // if(uId == authIdString){
  //   senderId = authIdString;
  // }
  // console.log('senderId',senderId);
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
  console.log('user._id',user.userId);
  console.log('req.params.userId',req.params.userId);

    try {
        const conversation = await Conversation.find({
           members : {$all: [req.params.userId, user.userId]} 
        })
      res.status(200).json({
        status: 'success',
        data: conversation,
        message: 'Get conversation successfully',
      })
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  });

  