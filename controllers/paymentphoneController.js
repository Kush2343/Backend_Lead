const crypto = require("crypto");
const axios = require("axios");
const User = require("../model/User");

const { createNewUser } = require("../Auth/register.js");
// const bcrypt = require("bcrypt");

function generateTransactionID() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000000);
  const merchantPrefix = "T";
  const transactionID = `${merchantPrefix}${timestamp}${randomNum}`;
  return transactionID;
}

async function newPayment(req, res) {
  console.log(req.body);
  try {
    const { name, phonenumber, password, role, email, amount} = req.body;
    console.log(name, phonenumber);
    // const hashedPassword = await bcrypt.hash(password, 10);

    const data = {
      merchantId: "PGTESTPAYUAT",
      merchantTransactionId: generateTransactionID(),
      merchantUserId: "MUID2QWQEFW5Q6WSER7",
      name: name,
      amount: amount * 100, // Convert amount to centsS
      redirectUrl: "http://localhost:5000/api/phonepe/status/",
      redirectMode: "POST",
      email: email,
      role: role,
      mobileNumber: phonenumber,
      password: password, // Ensure password security
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string =
      payloadMain + "/pg/v1/pay" + "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
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
    // new code manish
    axios
      .request(options)
      .then(async function (response) {
        console.log(response.data);

        try {
          const user_found = await User.findOne({
            $or: [{ name }, { phonenumber }],
          });

          if (user_found) {
            if (user_found.payment_status === "SUCCESSFUL") {
              res.json({ exist: "Account already exists" });
            } else {
              const new_user = {
                ...req.body,
                transaction_id: response.data.data.merchantTransactionId,
              };

              createNewUser(new_user);
              return res
                .status(200)
                .send(response.data.data.instrumentResponse.redirectInfo.url);
            }
          } else {
            const new_user = {
              ...req.body,
              transaction_id: response.data.data.merchantTransactionId,
            };
            createNewUser(new_user);
            return res.json(
              response.data.data.instrumentResponse.redirectInfo.url
            );
          }
        } catch (error) {
          console.log(error);
          res.status(500).json({ error: "internal server error" });
        }

        return res
          .status(200)
          .send(response.data.data.instrumentResponse.redirectInfo.url);
      })
      .catch(function (error) {
        console.error(error);
      });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false,
    });
  }
}
//end code manish

async function statusCheck(req, res) {
  const merchantTransactionId = res.req.body.transactionId;
  const merchantId = res.req.body.merchantId;

  const keyIndex = 1;
  const string =
    `/pg/v1/status/${merchantId}/${merchantTransactionId}` +
    "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
  // const string = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  const checksum = sha256 + "###" + keyIndex;

  const options = {
    method: "GET",
    url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": `${merchantId}`,
    },
  };

  // CHECK PAYMENT STATUS
  axios
    .request(options)
    .then(async (response) => {
      if (response.data.success === true) {
        const transaction_id = response.data.data.merchantTransactionId;
        const req_data = await User.findOne({ transaction_id });

        req_data.payment_status = "SUCCESSFUL";

        await req_data.save();

        const url = `http://localhost:3000/pay-success/${transaction_id}`;
        return res.redirect(url);
      } else {
        const url = `http://localhost:3000/register?status=failed`;
        return res.redirect(url);
      }
    })
    .catch((error) => {
      const url = `http://localhost:3000/register?status=failed`;
      return res.redirect(url);
      console.error(error);
    });
};

module.exports = { newPayment, statusCheck };
