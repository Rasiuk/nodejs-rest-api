const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userSchema = new Schema(
  {
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    email: {
      type: String,
      match: emailRegex,
      required: [true, "Email is required"],
      unique: true,
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },
    token: {
      type: String,
      default: null,
    },
    avatarURL: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);
const registerShema = Joi.object({
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().min(6).required(),
});

const loginShema = Joi.object({
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().min(6).required(),
});

const schemas = {
  registerShema,
  loginShema,
};

userSchema.post("save", handleMongooseError);
const User = model("user", userSchema);

module.exports = { User, userSchema, schemas };
