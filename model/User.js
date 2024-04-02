const bcrypt = require("bcrypt");
const Mongoose = require("mongoose")


const UserSchema = new Mongoose.Schema({
  name: {
    type: String,
    required: [true,"Name is required"]
  },
  email: {
    type: String,
    required : [true, "Email not found"],
    unique: [true,"Email is already registered"],
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    minlength: 6,
    required: [true,"Password is required"]
  },
  amount: {
    type: Number,
    required: [true, "Amount required"]
  },
  phonenumber: {
    type: String,
    unique: true,
    minlength: 10,
    maxlength: 10,
    // Regular expression for Indian phone number validation
    match: /^[6-9]\d{9}$/,
    required: [true,"Phonenumber is required"],
  },
  role: {
    type: String,
    default: "Basic",
    required: true,
  },
  transaction_id: {
    type : String,
    required : [true, "id not provided"]
  },
  payment_status: {
    type : String,
    enum : ['PENDING','SUCCESSFUL','FAILED'],
    default : "PENDING"
  }
},{timestamps : true})


const User = Mongoose.model("user", UserSchema);

module.exports = User;