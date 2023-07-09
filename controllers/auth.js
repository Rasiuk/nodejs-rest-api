const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const { ref } = require("joi");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const fs = require("fs/promises");
const Jimp = require("jimp");
const path = require("path");
const { nanoid } = require("nanoid");
const sgMail = require("@sendgrid/mail");
const { json } = require("express");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { SECRET_KEY } = process.env;
const avatarsDir = path.join(__dirname, "../", "public", "avatars");
//Register
async function register(req, res, next) {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  try {
    const currentUser = await User.findOne({ email: user.email });

    if (currentUser !== null) {
      return res.status(409).json({ message: "Email in use" });
    }
    const avatarURL = gravatar.url(user.email, { d: "robohash" });
    const verificationToken = nanoid();
    const hashPass = (user.password = await bcrypt.hash(user.password, 10));
    const newUser = await User.create({
      ...req.body,
      password: hashPass,
      avatarURL,
      verificationToken,
    });

    const msg = {
      to: user.email,
      from: process.env.SENDGRID_FROM,
      subject: "Verify email",
      text: "Verify your email)",
      html: ` <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#1a82e2" style="border-radius: 6px;">
                          <a href="http://localhost:3000/users/verify/${user.verificationToken}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px;">Click to verify</a>
                        </td></table>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        res.status(201).json({
          user: {
            email: newUser.email,
            subscription: "starter",
          },
        });
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {
    next(error);
  }
}
//Login
async function login(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user === null) {
      return res.status(401).json({ message: "Email or password incorrect" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch === false) {
      return res.status(401).json({ message: "Email or password incorrect" });
    }
    if (!user.verify) {
      return res.status(409).json({ message: "Please verify your email" });
    }
    const { _id: id } = user;
    const payload = { id };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });
    await User.findByIdAndUpdate(user._id, { token });
    res.json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
    res.end();
  } catch (error) {
    next(error);
  }
}
//Get curren user
async function getCurrent(req, res, next) {
  const { email } = req.user;
  const user = await User.findOne({ email });
  res.json({
    email: user.email,
    subscription: user.subscription,
  });
}
async function logout(req, res) {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json({
    message: "Logout success",
  });
}
//Update Avatar
async function updateAvatar(req, res, next) {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const filename = `${_id}_${originalname}`;
  console.log(tempUpload);
  try {
    const image = await Jimp.read(tempUpload);
    await image.resize(250, 250).write(path.join(avatarsDir, filename));

    const avatarURL = path.join("avatars", filename);
    await User.findByIdAndUpdate(_id, { avatarURL });

    res.json({
      avatarURL,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update avatar" });
  } finally {
    fs.unlink(tempUpload, (err) => {
      if (err) console.error(err);
    });
  }
}
//Verify
async function verifyEmail(req, res, next) {
  const { verificationToken } = req.params;
  try {
    const user = await User.findOne({ verificationToken });
    if (!user) {
      return res.status(404).json({ message: "User is not Foud" });
    }
    if (user.verify) {
      return res.status(404);
    }
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: null,
    });
    res.json("Verification successful");
  } catch (error) {
    next(error);
  }
}
//Resend verify link
async function resendVerify(req, res, next) {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .res.json({ message: "missing required field email" });
    }

    if (user.verify) {
      res.status(400);
      return res.json({ message: "Verification has already been passed" });
    }
    console.log(user);
    const msg = {
      to: user.email,
      from: process.env.SENDGRID_FROM,
      subject: "Verify email",
      text: "Verify your email)",
      html: ` <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#1a82e2" style="border-radius: 6px;">
                          <a href="http://localhost:3000/users/verify/${user.verificationToken}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px;">Click to verify</a>
                        </td></table>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        res.json({ message: "Verification email sent" });
        console.log("Email sent again");
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {}
}
module.exports = {
  register,
  login,
  getCurrent,
  logout,
  updateAvatar,
  verifyEmail,
  resendVerify,
};
