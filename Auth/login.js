const crypto = require("crypto");
const axios = require("axios");
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Function to generate a unique transaction ID
// function generateTransactionID() {
//   const timestamp = Date.now();
//   const randomNum = Math.floor(Math.random() * 1000000);
//   const merchantPrefix = "T";
//   const transactionID = `${merchantPrefix}${timestamp}${randomNum}`;
//   return transactionID;
// }

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email or Password not present" });
    }

    // Retrieve user from the database
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(400).json({user:false, message: "User not found" });
    }

    // Compare passwords
    const result = await bcrypt.compare(password, user.password);

    if (!result) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Check payment status
    if (user.payment_status === "SUCCESSFUL") {
      // Generate JWT token
      const maxAge = 2 * 60; // 3hrs in minutes
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWTSECRET,
        { expiresIn: maxAge } // 3hrs in sec
      );

      // Set token in cookie
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: maxAge * 1000, // 3hrs in ms
      });

      // Send success response
      return res.status(200).json({
        message: "User successfully logged in",
        user: true,
        _id: user._id,
        email: user.email,
        role: user.role,
        payment_status: user.payment_status,
        token: token
      });
    } else if (user.payment_status === "PENDING") {
      // Construct payment data
      const data = {
        merchantId: "PGTESTPAYUAT",
        merchantTransactionId: user.transaction_id,
        merchantUserId: "MUID2QWQEFW5Q6WSER7",
        amount: user.amount * 100, // Convert amount to cents
        redirectUrl: "http://localhost:5000/api/phonepe/status/",
        redirectMode: "POST",
        email: user.email,
        password: user.password, // Ensure password security
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      // Convert data to payload and calculate checksum
      const payload = JSON.stringify(data);
      const payloadMain = Buffer.from(payload).toString("base64");
      const keyIndex = 1;
      const string =
        payloadMain + "/pg/v1/pay" + "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
      const sha256 = crypto.createHash("sha256").update(string).digest("hex");
      const checksum = sha256 + "###" + keyIndex;

      // Set URL and options for payment request
      const URL =
        "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
      const options = {
        method: "POST",
        url: URL,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
        data: {
          request: payloadMain,
        },
      };

      // Make payment request
      const response = await axios(options);

      // Return payment page URL
      return res.status(200).json({
        user:true,
        payment_status: user.payment_status,
        payment_link: response.data.data.instrumentResponse.redirectInfo.url
    });
    } else {
      // Handle other payment statuses
      return res.status(400).json({ message: "Login not successful" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
}

async function statusCheck(req, res) {
  try {
    const { transactionId, merchantId } = req.body;

    // Construct URL for status check
    const url = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${transactionId}`;

    // Calculate checksum
    const keyIndex = 1;
    const string = url + "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    // Set headers
    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": merchantId,
    };

    // Make request to check status
    const response = await axios.get(url, { headers });

    // Handle response based on payment status
    if (response.data.success === true) {
      const transactionId = response.data.data.merchantTransactionId;

      // Find user by transactionId
      const user = await User.findOne({ transaction_id: transactionId });

      if (user) {
        // Update payment status to SUCCESSFUL
        user.payment_status = "SUCCESSFUL";
        await user.save();

        // Redirect to pay-success page
        const redirectUrl = `https://lead-hunter-olive.vercel.app/pay-success/${transactionId}`;
        return res.redirect(redirectUrl);
      } else {
        // User not found
        return res.redirect("https://lead-hunter-olive.vercel.app/register?status=failed");
      }
    } else {
      // Payment status not successful
      return res.redirect("https://lead-hunter-olive.vercel.app/register?status=failed");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return res.redirect("https://lead-hunter-olive.vercel.app/register?status=failed");
  }
};

module.exports = { login, statusCheck };
