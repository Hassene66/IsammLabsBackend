require("express-async-errors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const blocRoutes = require("./routes/blocRoutes");
const laboratoryRoutes = require("./routes/laboratoryRoutes");
const computerRoutes = require("./routes/computerRoutes");
const claimRoutes = require("./routes/claimRoutes");
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});
const express = require("express");
const cors = require("cors");
const ConnectDB = require("./config/db");
const app = express();

ConnectDB();

app.use(express.json());
app.use(cors());
app.use(
  "/api",
  authRoutes,
  userRoutes,
  blocRoutes,
  laboratoryRoutes,
  computerRoutes,
  claimRoutes
);
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`server listening at port ${PORT} `)
);
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
