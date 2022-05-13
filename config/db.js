const mongoose = require("mongoose");
const ConnectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("connected to mongoDB"))
    .catch((err) => {
      console.error(err);
    });
};
module.exports = ConnectDB;
