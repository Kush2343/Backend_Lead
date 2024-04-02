const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text, forgetPasswordLink, emailId) => {
    try {
        const transporter = nodemailer.createTransport({
            // host: process.env.HOST,
            service: 'gmail',
            // port: 587,
            // secure: false,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS
            }
        });

        await transporter.sendMail({
            from: process.env.USER,
            to: email,
            subject: subject,
            text: `${text} ${forgetPasswordLink} ${emailId}`
        });

        console.log("Email sent successfully");
    } catch (error) {
        console.log(error, "Email not sent");
    }
};

module.exports = sendEmail;
