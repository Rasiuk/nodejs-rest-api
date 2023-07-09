const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/auth");
const { authenticate } = require("../../middlewars/authenticate");
const validateBody = require("../../middlewars/validateBody");
const { schemas } = require("../../models/user");
const { uploadFiles } = require("../../middlewars/uploadFiles");
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

//Update Avatar
router.patch(
  "/avatars",
  authenticate,
  uploadFiles.single("avatar"),
  AuthController.updateAvatar
);
module.exports = router;
//Verify user
router.get("/verify/:verificationToken", AuthController.verifyEmail);
//Resend verify
router.post(
  "/verify",
  validateBody(schemas.emailShema),
  AuthController.resendVerify
);
