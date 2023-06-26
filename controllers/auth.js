const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const { ref } = require("joi");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = process.env;
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
    user.password = await bcrypt.hash(user.password, 10);
    await User.create(user);
    res.status(201).json({
      user: {
        email: user.email,
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
module.exports = { register, login, getCurrent, logout };
