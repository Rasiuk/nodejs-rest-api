const jwt = require("jsonwebtoken");
const { SECRET_KEY } = process.env;
const { User } = require("../models/user");
const { HttpError } = require("../helpers");
const authenticate = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");

  if (bearer !== "Bearer") {
    next(HttpError(401));
  }
  try {
    const { id } = jwt.verify(token, SECRET_KEY);

    const user = await User.findById(id);
    console.log(user);
    if (!user || !user.token || user.token !== token) {
      console.log(`error in 2 if token`);
      next(HttpError(401));
    }
    req.user = user;
    next();
  } catch {
    next(HttpError(401));
  }
};
module.exports = { authenticate };
