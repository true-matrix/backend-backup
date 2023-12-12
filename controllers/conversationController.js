const Conversation = require("../models/conversation");
const catchAsync = require("../utils/catchAsync");

// New Conversation
exports.newConversation = catchAsync(async (req, res, next) => {
    const newConversation = new Conversation({
        members : [req.body.senderId, req.body.receiverId]
      })
    try {
      const saveConversation = await newConversation.save();
      res.status(200).json({
        status: 'success',
        data: saveConversation,
        message: 'New conversation started',
      })
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
    try {
        const conversation = await Conversation.find({
           members : {$in: [req.params.userId]} 
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

  