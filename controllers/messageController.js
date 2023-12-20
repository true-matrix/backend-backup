const jwt = require("jsonwebtoken");
const Message = require("../models/message");
const catchAsync = require("../utils/catchAsync");


// Add Message
exports.addMessage = catchAsync(async (req, res, next) => {
    const newMessage = new Message(req.body)
    try {
      const saveMessage = await newMessage.save();
      res.status(200).json({
        status: 'success',
        data: saveMessage,
        message: 'Add message successfully',
      })
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  });

// Get Messages
// exports.getMessages = catchAsync(async (req, res, next) => {
//     try {
//         const messages = await Message.find({
//            conversationId : req.params.conversationId
//         })
//       res.status(200).json({
//         status: 'success',
//         data: messages,
//         message: 'Get messages successfully',
//       })
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({
//         status: 'error',
//         message: 'Internal server error',
//       });
//     }
//   });

exports.getMessages = catchAsync(async (req, res, next) => {
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
    }).populate('sender receiver', 'name email avatar seen received'); // Adjust the fields as needed

    res.status(200).json({
      status: 'success',
      data: messages,
      message: 'Messages found successfully!',
    });
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
  });