    const express = require("express");
    const cookieParser = require("cookie-parser");
    const connectDB = require("./database/db");
    const cors = require('cors');
    const bcrypt = require('bcrypt');
    const routes = require("./Auth/route");
    const passwordReset = require("./Auth/passwordReset");
    const { adminAuth, userAuth } = require("./middleware/auth");
    const phonepeRoute = require("./routes/phoneperoute");
    const { userRouter } = require("./Auth/route");

    const dotenv = require('dotenv');

    dotenv.config();

    const app = express(); // Initialize express app here

    app.use(cors( { origin:'https://lead-hunter-olive.vercel.app',credentials:true})); // Now you can use cors middleware after initializing app

    connectDB();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.get("/", (req, res) => res.render("home"));

app.get("/logout", (req, res) => {
    res.cookie("jwt", "", { maxAge: "0" });
    // res.redirect("/");
    res.status(200).json({ message: 'Logged out successfully' });
});

    // Authentication routes
    app.use("/api/auth", require("./Auth/route"));

    // Additional routes with authentication middleware
    app.use("/api/routes", routes);
    app.use("/api/passwordReset", passwordReset);

    app.use("/api/phonepe", phonepeRoute);

    // Adding admin and basic routes with their respective middleware
    app.get("/api/admin", adminAuth, (req, res) => res.send("Admin Route"));
    app.get("/api/basic", userAuth, (req, res) => res.send("User Route"));

    // app.use('/api/leads', routes);
    app.use("/api/leads", userAuth, routes);

    app.use("/api/v1", userRouter);

    app.get("/api/getkey", (req, res) =>
        res.status(200).json({ key: process.env.KEY_ID })
    );

    const PORT = process.env.PORT || 9000;
    const server = app.listen(PORT, () => console.log(`Server connected to port ${PORT}`));

    process.on("unhandledRejection", err => {
        console.log(`An error occurred: ${err.message}`);
        server.close(() => process.exit(1));
    });
