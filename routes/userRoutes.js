const router = require("express").Router();
const {
  findAllUser,
  createUser,
  findUser,
  deleteUser,
  updateUser,
} = require("../../controllers/usersController");
const { protect, authorize } = require("../../middleware/authMiddleware");
// Get All users
router.get("/users", findAllUser);
// Add user
router.post("/users", createUser);
// get user by id
router.get("/users/:userId", findUser);
// update user
router.put("/users/:userId", updateUser);
// delete user
router.delete("/users/:userId", deleteUser);

module.exports = router;
