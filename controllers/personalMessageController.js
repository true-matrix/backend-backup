const PersonalMessage = require("../models/personalMessage");
const catchAsync = require("../utils/catchAsync");
const uuid = require('uuid');

// Add Message
exports.sendMessage = catchAsync(async (req, res, next) => {
    try {
        let { conversationId, sender_id, receiver_id, text, image } = req.body;

        // Check if the conversationId already exists
        let existingConversation = await PersonalMessage.findOne({ conversationId });

        if (!existingConversation) {
            // If conversationId doesn't exist, generate a new one
            conversationId = uuid.v4();
            existingConversation = new PersonalMessage({
                conversationId,
                sender_id,
                receiver_id,
                text,
                image,
                seen: false,
                received: false,
            });
        } else {
            // If conversationId exists, add the message to the existing conversation
            existingConversation.sender_id = sender_id;
            existingConversation.receiver_id = receiver_id;
            existingConversation.text = text;
            existingConversation.image = image;
            existingConversation.seen = false;
            existingConversation.received = false;
        }
    
        const savedMessage = await existingConversation.save();
        // Emit a Socket.IO event after saving the message
        req.io?.emit('newMessage', { message: savedMessage });

        res.status(200).json({
            status: 'success',
            data: savedMessage,
            message: 'sent messages successfully',
          })
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
  });

// Get Messages
exports.getMessages = catchAsync(async (req, res, next) => {
    try {
        const conversationId = req.params.conversationId;
        const messages = await PersonalMessage.find({ conversationId });
        res.status(200).json({
            status: 'success',
            data: messages,
            message: 'get messages successfully',
          })
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
  });