require("express-async-errors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const blocRoutes = require("./routes/blocRoutes");
const laboratoryRoutes = require("./routes/laboratoryRoutes");
const computerRoutes = require("./routes/computerRoutes");
const claimRoutes = require("./routes/claimRoutes");
const serviceAccount = require("./issam-labs-cc4b7-firebase-adminsdk-940fo-8ae33d6802.json");
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});
const express = require("express");
const cors = require("cors");
const ConnectDB = require("./config/db");
const admin = require("firebase-admin");
const errorHandler = require("./middlewares/errorMiddleware");
const app = express();
ConnectDB();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => res.send("ISAMM Backend"));
app.use(
  "/api",
  authRoutes,
  userRoutes,
  blocRoutes,
  laboratoryRoutes,
  computerRoutes,
  claimRoutes
);
app.use(errorHandler);
app.all("/api/*", (req, res) => {
  res.status(404).json({
    message: `Impossible de trouver le route ${req.originalUrl} `,
  });
});
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
