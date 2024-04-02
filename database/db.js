const Mongoose = require("mongoose")

const connectDB = async () => {
  try{
    const connectionInstance = await Mongoose.connect(process.env.localDB)
    console.log("Mongo DB Connected")
  } catch(error) {
    console.log (error, "Mongo DB connection failed")
  }
}

module.exports = connectDB