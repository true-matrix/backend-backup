const router = require("express").Router();

const authController = require("../controllers/authController");

// router.post("/login", authController.login);
// router.post("/logout", authController.logout);
// router.post("/register", authController.register, authController.sendOTP);
// router.post("/verify", authController.verifyOTP);
// router.post("/send-otp", authController.sendOTP);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.post("/adduser", authController.addUser);
router.delete('/:id', authController.deleteUser);
router.post("/login", authController.login, authController.sendOTP);
router.post("/send-otp", authController.sendOTP);
router.post("/verify", authController.verifyOTP);
router.post("/logout", authController.logout);

module.exports = router;
