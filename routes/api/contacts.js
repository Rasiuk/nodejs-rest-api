const express = require("express");
const router = express.Router();
const controller = require("../../controllers/contacts");
const { authenticate } = require("../../middlewars/authenticate");

router.use(authenticate);

router.get("/", controller.listContacts);

router.get("/:id", controller.getById);

router.post("/", controller.addContact);

router.delete("/:id", controller.deleteContact);

router.put("/:id", controller.updateContact);

router.patch("/:id/favorite", controller.updateStatusContact);

module.exports = router;
