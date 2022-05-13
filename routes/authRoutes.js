const router = require("express").Router();
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  updateEmail,
  resetEmail,
  getMe,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.put("/updatedetails", protect, authorize("coach"), updateDetails);
router.post("/updateemail", protect, authorize("coach"), updateEmail);
router.put("/updatepassword", protect, authorize("coach"), updatePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);
router.put("/resetemail/:resettoken", resetEmail);
router.get("/me", protect, authorize("coach", "joueur"), getMe);
module.exports = router;
