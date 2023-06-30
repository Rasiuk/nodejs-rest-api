const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/auth");
const { authenticate } = require("../../middlewars/authenticate");
const validateBody = require("../../middlewars/validateBody");
const { schemas } = require("../../models/user");
// Register
router.post(
  "/register",
  validateBody(schemas.registerShema),
  AuthController.register
);
// Login
router.post("/login", validateBody(schemas.loginShema), AuthController.login);
router.get("/current", authenticate, AuthController.getCurrent);
router.post("/logout", authenticate, AuthController.logout);
module.exports = router;
