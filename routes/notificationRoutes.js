const router = require("express").Router();
const {
  findAllNotifications,
  createNotification,
  findNotification,
  deleteNotification,
  updateNotification,
} = require("../controllers/notificationController");
// Get All users
router.get("/notification", findAllNotifications);
// Add user
router.post("/notification", createNotification);
// get user by id
router.get("/notification/:notificationId", findNotification);
// update user
router.put("/notification/:notificationId", updateNotification);
// delete user
router.delete("/notification/:notificationId", deleteNotification);

module.exports = router;
