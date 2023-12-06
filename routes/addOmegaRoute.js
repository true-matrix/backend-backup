const router = require("express").Router();
const authController = require("../controllers/authController");
const omegaController = require("../controllers/omegaController");

router.post("/addomega", omegaController.addOmega);

module.exports = router;