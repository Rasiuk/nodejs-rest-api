const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const { ref } = require("joi");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const fs = require("fs/promises");
const Jimp = require("jimp");
const path = require("path");

const { SECRET_KEY } = process.env;
const avatarsDir = path.join(__dirname, "../", "public", "avatars");

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

    const hashPass = (user.password = await bcrypt.hash(user.password, 10));
    const newUser = await User.create({
      ...req.body,
      password: hashPass,
      avatarURL,
    });

    // await User.create(user);
    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: "starter",
      },
    });
  } catch (error) {
    next(error);
  }
}
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

module.exports = { register, login, getCurrent, logout, updateAvatar };
