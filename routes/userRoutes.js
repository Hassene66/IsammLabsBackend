const router = require("express").Router();
const {
  findAllUser,
  createUser,
  findUser,
  deleteUser,
  updateUser,
  updateFcmKey,
} = require("../controllers/userController");
// Get All users
router.get("/users", findAllUser);
// Add user
router.post("/users", createUser);
// get user by id
router.get("/users/:userId", findUser);
// update user
router.put("/users/:userId", updateUser);
// update fcm key
router.put("/users/fcm/:userId", updateFcmKey);
// delete user
router.delete("/users/:userId", deleteUser);

module.exports = router;
