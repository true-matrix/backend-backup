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
exports.getMessages = catchAsync(async (req, res, next) => {
    try {
        const messages = await Message.find({
           conversationId : req.params.conversationId
        })
      res.status(200).json({
        status: 'success',
        data: messages,
        message: 'Get messages successfully',
      })
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  });