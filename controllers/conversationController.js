const jwt = require("jsonwebtoken");
const axios = require('axios');
const Conversation = require("../models/conversation");
const User = require("../models/user");
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

  // Get All Conversations of a loggedin user
exports.getAllConversations = catchAsync(async (req, res, next) => {
    // Extract token from headers or cookies
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
  
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }
  
    // Verify the token and get user information
    const user = jwt.verify(token, process.env.JWT_SECRET);
  
    try {
      // Find all conversations where the logged-in user is a member
      const conversations = await Conversation.find({
        members: user.userId,
      });
  
      res.status(200).json({
        status: 'success',
        data: conversations,
        message: 'Get all conversations successfully',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  });  

// Get All Chats Users
exports.getAllChatsUsers = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
  
    if (!token) {
      return res.status(401).json({ message: 'User is already logged out!!!' });
    }
  
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
  
      // Assuming user.userId is present in the decoded JWT payload
      const userId = user.userId;
  
      // Call the getAllConversations API to get conversations
      const conversationsResponse = await axios.get('http://68.178.173.95:3001/user/get-all-conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Extract user IDs from the conversations
      const conversationMembers = conversationsResponse.data.data.reduce((members, conversation) => {
        return members.concat(conversation.members);
      }, []);
  
      // Remove duplicate user IDs
      const uniqueUserIds = [...new Set(conversationMembers)];
  
      // Get all users except the logged-in user
      const remainingUsers = await User.find({
        _id: { $in: uniqueUserIds, $ne: userId }, // Exclude the logged-in user
      }).select('name gender _id');
  
      res.status(200).json({
        status: 'success',
        data: remainingUsers,
        message: 'Users found successfully!',
      });
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  });
  

  