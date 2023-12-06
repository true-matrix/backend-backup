const router = require("express").Router();

const authRoute = require("./auth");
const userRoute = require("./user");
const addomegaRoute = require("./addOmegaRoute")
const omegaRoute = require("./omegaRoute")

router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/admin", addomegaRoute);
router.use("/omega", omegaRoute);

module.exports = router;