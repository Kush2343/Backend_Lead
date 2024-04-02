const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ message: "Email or Password not present" });
  }

  try {
    // Retrieve user from the database
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res
        .status(400)
        .json({ message: "Login not successful", error: "User not found" });
    }

    // Compare passwords
    bcrypt.compare(password, user.password).then(function (result) {
      if (result) {
        const maxAge = 2 * 60;
        const token = jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWTSECRET,
          { expiresIn: maxAge } // 3hrs in sec
        );
        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: maxAge * 1000, // 3hrs in ms
        });
        res.status(200).json({
          message: "User successfully Logged in",
          user: {
            _id: user._id,
            email: user.email,
            role: user.role
          },
          token: token
        });
      } else {
        res.status(400).json({ message: "Login not successful" });
      }
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
};
