const mongoose = require("mongoose");
const app = require("./app");

require("dotenv").config();
mongoose
  .connect(process.env.DB_URI)
  .then(() => {
    app.listen(3000, () => {
      console.log("Database connection successful");
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
