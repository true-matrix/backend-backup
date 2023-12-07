const router = require("express").Router();
const authController = require("../controllers/authController");
const omegaController = require("../controllers/omegaController");

// router.post("/login", omegaController.loginOmega);
router.post("/login", omegaController.loginOmega, omegaController.sendOTP);
router.post("/send-otp", omegaController.sendOTP);
router.post("/verify", omegaController.verifyOTP);
router.post("/logout", omegaController.logout);

router.get("/get-all-verified-omegas", omegaController.getAllVerifiedOmegas);
router.get("/search-user", omegaController.searchUsers);
router.get("/:userId", omegaController.getUserById);





module.exports = router;