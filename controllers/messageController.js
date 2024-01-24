const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Message = require("../models/message");
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage")
const User = require("../models/user");
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
          path: `http://68.178.173.95:3001/uploads/${file.filename}`,
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

/***************Group Message***************/
//Create a new group
exports.createGroup =catchAsync(async (req, res) => {
  try{
    const { groupname, description, admin, members } = req.body;

    // Validate input
    if (!groupname || !admin || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Check if the admin and members exist in the User collection
    const [adminUser, ...memberUsers] = await Promise.all([
      User.findById(admin),
      ...members.map(memberId => User.findById(memberId)),
    ]);

    // Validate if all users exist
    if (!adminUser || memberUsers.some(user => !user)) {
      return res.status(400).json({ error: 'Invalid user ID(s)' });
    }

    // // Create a new group chat
    // const newGroupChat = new Group({
    //   groupname,
    //   description,
    //   admin: adminUser._id,
    //   members: memberUsers.map(user => user._id),
    // });

     // Create a new group chat
     const newGroupChat = new Group({
      groupname,
      description,
      admin: adminUser.toObject(), // Use toObject() to convert to a plain JavaScript object
      members: memberUsers.map(user => user.toObject()), // Use toObject() for each member
  });

    // Save the group chat to the database
    await newGroupChat.save();
    res.status(200).json({
      status: 'success',
      data: newGroupChat ,
      message: 'New group created successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

//Get all groups for the logged-in user
exports.getAllGroups =catchAsync(async (req, res) => {
  try{
    // Find all groups where the user is either the admin or a member
    // const groups = await Group.find({
    //   $or: [
    //     { admin: req.user._id },
    //     { members: req.user._id },
    //   ],
    // });
    const groups = await Group.find({
      $or: [
        { admin: req.user._id },
        { members: req.user._id },
      ],
    })
    .populate('admin')  // Populate the 'admin' field
    .populate('members'); // Populate the 'members' field

    res.status(200).json({
      status: 'success',
      data: groups ,
      message: 'All groups found successfully',
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }

});

//Delete a group
exports.deleteGroup =catchAsync(async (req, res) => {
  const groupId = req.params.groupId;

  // Validate if groupId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ error: 'Invalid group ID' });
  }

  // Find the group and check if the logged-in user is the admin
  const group = await Group.findOne({ _id: groupId, admin: req.user._id });

  if (!group) {
    return res.status(404).json({ error: 'Group not found or you do not have permission to delete it' });
  }

  // Delete the group
  await Group.findByIdAndDelete(groupId);

  res.status(200).json({
    status: 'success',
    message: 'Group deleted successfully',
  });
});

//Get a group details by group Id
exports.getGroupById =catchAsync(async (req, res) => {
  const groupId = req.params.groupId;

  // Validate if groupId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ error: 'Invalid group ID' });
  }

  // Find the group by ID
  const group = await Group.findOne({ _id: groupId })
    .populate('admin')  // Populate the 'admin' field
    .populate('members'); // Populate the 'members' field

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  res.status(200).json({
    status: 'success',
    data: group,
    message: 'Group retrieved successfully',
  });
});

//Send Message in a group
exports.sendGroupMessage = catchAsync( async (req, res, next) => {
  try {
    // Map uploaded files to the required format
    const images = req.files
      ? req.files.map((file) => ({
          path: `http://68.178.173.95:3001/uploads/${file.filename}`,
          filename: file.filename,
        }))
      : [];

    // Filter the body properties
    const filteredBody = filterObj(req.body, 'group', 'sender', 'message');

    // Create a new GroupMessage instance
    const newMessage = new GroupMessage({
      ...filteredBody,
      images: images,
    });

    // Save the new message to the database
    const savedMessage = await newMessage.save();

    res.status(200).json({
      status: 'success',
      data: savedMessage,
      message: 'Message added successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }

});

//Get all messages in a group by group id
exports.getGroupMessages = catchAsync( async (req, res, next) => {
  try {
    const groupId = req.params.groupId;

    // Find all messages for the specified group
    const groupMessages = await GroupMessage.find({ group: groupId })
      .populate('sender', 'name avatar seen received userRole') // Populate the 'sender' field with name, avatar, and status from the 'User' model
      .exec();

    res.status(200).json({
      status: 'success',
      data: groupMessages,
      message: 'Retrieved group messages successfully',
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