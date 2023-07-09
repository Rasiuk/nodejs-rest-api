const multer = require("multer");
const { nanoid } = require("nanoid");
const path = require("path");

const tempDir = path.join(__dirname, "../", "temp");

const multerStorage = multer.diskStorage({
  destination: (req, file, fnc) => {
    fnc(null, tempDir);
  },
  filename: (req, file, fnc) => {
    const extension = file.mimetype.split("/")[1];
    fnc(null, `${req.user.id}-${nanoid()}.${extension}`);
  },
});

const uploadFiles = multer({
  storage: multerStorage,
});

module.exports = { uploadFiles };
