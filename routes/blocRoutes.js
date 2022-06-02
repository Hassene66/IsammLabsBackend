const router = require("express").Router();
const {
  findAllBlocs,
  createBloc,
  findBloc,
  deleteBloc,
  updateBloc,
} = require("../controllers/blocController");
// Get All users
router.get("/bloc", findAllBlocs);
// Add user
router.post("/bloc", createBloc);
// get user by id
router.get("/bloc/:blocId", findBloc);
// update user
router.put("/bloc/:blocId", updateBloc);
// delete user
router.delete("/bloc/:blocId", deleteBloc);

module.exports = router;
