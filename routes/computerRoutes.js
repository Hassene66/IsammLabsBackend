const router = require("express").Router();
const {
  findAllComputers,
  createComputer,
  findComputer,
  deleteComputer,
  updateComputer,
} = require("../controllers/computerController");
// Get All users
router.get("/computer", findAllComputers);
// Add user
router.post("/computer", createComputer);
// get user by id
router.get("/computer/:computerId", findComputer);
// update user
router.put("/computer/:computerId", updateComputer);
// delete user
router.delete("/computer/:computerId", deleteComputer);

module.exports = router;
