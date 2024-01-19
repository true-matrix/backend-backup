const jwt = require("jsonwebtoken");
const Message = require("../models/message");
const catchAsync = require("../utils/catchAsync");
const filterObj = require("../utils/filterObj");
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Set your upload directory
  },
  filename: (req, file, cb) => {
    // let filename = Date.now() + '-' + file.originalname
    // req.body.file = filename
    // cb(null, filename);
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

const uploadFile = upload.array('files')
exports.addMessage = catchAsync( async (req, res, next) => {
  

  try {
     // Handle multiple file uploads
    //  uploadFile(req, res, async (err) => {
      // if (err) {
      //   console.error('Error uploading files:', err);
      //   return res.status(400).json({
      //     status: 'error',
      //     message: 'Files upload error',
      //     error: err.message,
      //   });
      // }
      console.log('req.files',req.files);
      console.log('req.file',req.file);
      console.log('req.body',req.body);
      console.log('req=>',req);
      // console.log('req.body.images',JSON.parse(req.body.images));
      // console.log('req.body=>',JSON.parse(JSON.stringify(req.body)));

      const images = req.files
      ? req.files.map((file) => ({
          // path: file.path,
          path: `https://68.178.173.95:3001/uploads/${file.filename}`,
          filename: file.filename,
        }))
      : [];
     
     // Filter the body properties
     const filteredBody = filterObj(
      req.body,
      'sender',
      'receiver',
      'text',
    );
    

    // console.log('req=>',req);
    
    // if (req.files) {
    //   filteredBody.images = req.files.map(file => ({
    //     fieldname: file.fieldname,
    //     originalname: file.originalname,
    //     encoding: file.encoding,
    //     mimetype: file.mimetype,
    //     destination: file.destination,
    //     filename: req?.files?.filename,
    //     path: `http://localhost:3001/uploads/${req?.files?.filename}`,
    //     size: file.size,
    //   }));
    // }
    // if (req.file) {
    //   // Modify filteredBody.images assignment
    //   filteredBody.images = [{
    //     fieldname: req.file.fieldname,
    //     originalname: req.file.originalname,
    //     encoding: req.file.encoding,
    //     mimetype: req.file.mimetype,
    //     destination: req.file.destination,
    //     filename: req.file.filename,
    //     path: `http://localhost:3001/uploads/${req.file.filename}`,
    //     size: req.file.size,
    //   }];
    // }

    // if (req?.files) {
    //   filteredBody.images = req.files.map(file => ({ url: `http://localhost:3001/uploads/${file.path}` }));
    // }


    const newMessage = new Message({
      ...req.body, // Use the rest operator to include other properties in req.body
      images: images // Use the entire files array or just imagePaths based on your preference
    });
    // const newMessage = new Message(filteredBody);
    const saveMessage = await newMessage.save();

    // req.file = undefined;
      
      // Continue with your logic...

      // Example: Save the message to the database
      // const saveMessage = await Message.create(filteredBody);

    res.status(200).json({
      status: 'success',
      data: saveMessage,
      message: 'Add message successfully',
    });
  // });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

//Delete Message
exports.deleteMessage =catchAsync(async (req, res) => {
  const { messageId } = req.params;

  try {
    // Check if the message with the provided ID exists
    const existingMessage = await Message.findById(messageId);
    if (!existingMessage) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
    }

    existingMessage.text = 'This message deleted';
    // Perform the deletion by setting the 'deleted' field to true
    existingMessage.deleted = true;
    await existingMessage.save();

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});


// Add Message
// exports.addMessage = catchAsync(async (req, res, next) => {
//     const newMessage = new Message(req.body)
//     try {
//       const saveMessage = await newMessage.save();
//       res.status(200).json({
//         status: 'success',
//         data: saveMessage,
//         message: 'Add message successfully',
//       })
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({
//         status: 'error',
//         message: 'Internal server error',
//       });
//     }
//   });


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