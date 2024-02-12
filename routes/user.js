const router = require("express").Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const fileController = require("../controllers/fileController");
const conversationController = require("../controllers/conversationController");
const messageController = require("../controllers/messageController");
const personalMessageController = require("../controllers/personalMessageController");
// const imageController = require("../controllers/imageController");

const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Set your upload directory
  },
  filename: (req, file, cb) => {
    console.log('filee',file)
    console.log('reqq',req)
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });
// const uploadFilesMiddleware = upload.array('files');
const uploadFilesMiddleware = (req, res, next) => {
  console.log('uploadFilesMiddleware executed',req);
  upload.array('files')(req, res, (err) => {
    if (err) {
      console.error('Error uploading files:', err);
      return res.status(400).json({
        status: 'error',
        message: 'Files upload error',
        error: err.message,
      });
    }
    next();
  });
};

router.post(
  "/generate-zego-token",
  authController.protect,
  userController.generateZegoToken
);
router.get("/get-call-logs", authController.protect, userController.getCallLogs);
router.get("/get-me", authController.protect, userController.getMe);
router.patch("/update-me", authController.protect, userController.updateMe);
router.post("/upload", authController.protect, fileController.fileUpload);
// router.get('/:imageId',authController.protect, fileController.getImage);
// router.get("/get-all-verified-users", authController.protect, userController.getAllVerifiedUsers);
// router.get("/get-users", authController.protect, userController.getUsers);
router.get("/get-requests", authController.protect, userController.getRequests);
router.get("/get-friends", authController.protect, userController.getFriends);

router.post("/start-audio-call", authController.protect, userController.startAudioCall);
router.post("/start-video-call", authController.protect, userController.startVideoCall);


router.get("/get-all-verified-users",authController.protect,  userController.getAllVerifiedUsers);
router.get("/get-all-users",authController.protect,  userController.getAllUsers);
router.get("/search-user", userController.searchUsers);
router.get("/user-id/:id",authController.protect,  userController.getUserById);

//Update User by Admin
router.post("/updateuser/:userId",authController.protect,  userController.updateUser);

router.get("/get-all-alphas",authController.protect,  userController.getAllAlpha);

//Sigma
router.post("/sigma/addsigma",authController.protect,  userController.addSigma);
router.delete("/sigma/:id",authController.protect,  userController.deleteSigma);
router.post("/sigma/update-sigma/:userId",authController.protect,  userController.updateSigma);
router.get("/sigma/get-all-sigmas",authController.protect,  userController.getAllSigma);


//Conversation
router.post("/conversations",authController.protect,  conversationController.newConversation);
router.get("/conversations/:userId",authController.protect,  conversationController.getConversation);
router.get("/get-all-conversations",authController.protect,  conversationController.getAllConversations);
router.get("/get-all-chats-users",authController.protect,  conversationController.getAllChatsUsers);

//Message
router.post("/messages",authController.protect, uploadFilesMiddleware, messageController.addMessage);
// router.get("/messages/:conversationId",authController.protect,  messageController.getMessages);
router.get("/allMessages",authController.protect,  messageController.getMessages);
router.get("/getUsersByMessage",authController.protect,  userController.getAllChattingUsers);
router.post("/resetUnreadMessage",authController.protect,  userController.resetUnreadMessagesCount);
router.delete("/:messageId",authController.protect,  messageController.deleteMessage);

//Group Message
router.post("/group/createNewGroup",authController.protect, messageController.createGroup);
router.get("/group/allGroups",authController.protect, messageController.getAllGroups) //Get all groups for the logged-in user
router.delete("/group/:groupId",authController.protect,  messageController.deleteGroup);
router.get("/group/:groupId",authController.protect,  messageController.getGroupById);
router.post("/group/sendmessage",authController.protect, uploadFilesMiddleware, messageController.sendGroupMessage);
router.get("/group/:groupId/messages",authController.protect,  messageController.getGroupMessages);
router.post("/group/resetUnreadGroupMessage",authController.protect,  userController.resetUnreadGroupMessagesCount);




// router.post("/send-messages",authController.protect,  personalMessageController.sendMessage);
// router.get("/get-messages/:conversationId",authController.protect,  personalMessageController.getMessages);



module.exports = router;
