const express = require("express")
const router = express.Router()
const { login  } = require("./login")
const leadController = require("../controllers/leadController")
const { adminAuth } = require("../middleware/auth")

const { addUser } = require("../Auth/register")


const userRouter = require("express").Router();

// router.route("/register").post(register)
router.route("/login").post(login)

// POST /leads - Create a new lead
router.post('/', leadController.createLead);

// GET /leads - Get all leads
router.get('/', leadController.getAllLeads);

// DELETE /leads/:id - Delete a lead by ID
// router.delete('/:id', leadController.deleteLeadById);
router.delete("/:id", adminAuth, leadController.deleteLeadById);


router.route("/user").post(addUser)


module.exports = router


module.exports.userRouter = userRouter;