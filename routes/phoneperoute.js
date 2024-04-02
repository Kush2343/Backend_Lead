const express = require("express")
const { newPayment, statusCheck } = require("../controllers/paymentphoneController.js");

const router = express.Router()

router.route("/payment").post(newPayment)
router.route('/status').post(statusCheck);

module.exports = router;