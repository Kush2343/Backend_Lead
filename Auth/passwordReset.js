const User = require("../model/User");
const Token = require("../model/token");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const Joi = require("joi");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

// Store the timestamp of the last password reset request for each user
const lastResetRequest = {};

router.post("/", async (req, res) => {
    const { email } = req.body;

    try {
        const schema = Joi.object({ email: Joi.string().email().required() });
        const { error } = schema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).send("User with given email doesn't exist");

        // Check if it's been at least one minute since the last password reset request
        if (lastResetRequest[user._id] && Date.now() - lastResetRequest[user._id] < 60000) {
            return res.status(400).send("Please wait at least one minute before requesting another password reset");
        }

        let token = await Token.findOne({ userId: user._id });
        if (!token) {
            token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex"),
            }).save();
        }

        const link = `https://lead-hunter-olive.vercel.app/api/passwordReset/${user._id}/${token.token}`;
        
        await sendEmail(user.email, "Password reset", "Password reset link:", link, user.email);

        // Store the timestamp of the current password reset request
        lastResetRequest[user._id] = Date.now();

        res.send(link);
    } catch (error) {
        res.send("An error occurred");
        console.log(error);
    }
});

router.post("/:userId/:token", async (req, res) => {
    try {
        const schema = Joi.object({ password: Joi.string().required() });
        const { error } = schema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(400).send("Invalid link or expired");

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!token) return res.status(400).send("Invalid link or expired");

        // Hash the new password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        user.password = hashedPassword;
        await user.save();

        // Delete the token
        await token.deleteOne();

        res.send("Password reset successfully.");
    } catch (error) {
        res.send("An error occurred");
        console.log(error);
    }
});

module.exports = router;
