const express = require("express")
const router = express.Router()
const { login , statusCheck  } = require("./login")
const leadController = require("../controllers/leadController")
const { adminAuth } = require("../middleware/auth")
// const {newPayment} = require("../Auth/login")
const { addUser } = require("../Auth/register")


const userRouter = require("express").Router();

// router.route("/register").post(register)
router.route("/payment").post(login)

// POST /leads - Create a new lead
router.post('/', leadController.createLead);

// GET /leads - Get all leads
router.get('/', leadController.getAllLeads);

// DELETE /leads/:id - Delete a lead by ID
// router.delete('/:id', leadController.deleteLeadById);
router.delete("/:id", adminAuth, leadController.deleteLeadById);

// router.route("/payment").post(newPayment)


router.route("/user").post(addUser)

router.route('/status').post(statusCheck);


module.exports = router


module.exports.userRouter = userRouter;