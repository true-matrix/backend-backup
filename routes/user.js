const router = require("express").Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const fileController = require("../controllers/fileController");
// const imageController = require("../controllers/imageController");

router.post(
  "/generate-zego-token",
  authController.protect,
  userController.generateZegoToken
);
router.get("/get-call-logs", authController.protect, userController.getCallLogs);
router.get("/get-me", authController.protect, userController.getMe);
router.patch("/update-me", authController.protect, userController.updateMe);
router.post("/upload", authController.protect, fileController.fileUpload);
router.get('/:imageId',authController.protect, fileController.getImage);
router.get("/get-all-verified-users", authController.protect, userController.getAllVerifiedUsers);
router.get("/get-users", authController.protect, userController.getUsers);
router.get("/get-requests", authController.protect, userController.getRequests);
router.get("/get-friends", authController.protect, userController.getFriends);

router.post("/start-audio-call", authController.protect, userController.startAudioCall);
router.post("/start-video-call", authController.protect, userController.startVideoCall);


module.exports = router;