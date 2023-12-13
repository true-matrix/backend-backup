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

  // Use findOneAndUpdate with upsert option
  const existingConversation = await Conversation.findOneAndUpdate(
    {
      members: {
        $all: [senderId, receiverId],
      },
    },
    {}, // empty update, no actual changes to the document
    {
      upsert: true,
      new: true, // return the modified document
    }
  );

  res.status(200).json({
    status: 'success',
    data: existingConversation,
    message: existingConversation ? 'Existing conversation found' : 'New conversation started',
  });
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

  