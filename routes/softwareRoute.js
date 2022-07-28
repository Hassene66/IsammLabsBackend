const router = require("express").Router();
const {
  findAllSoftware,
  findSoftware,
  createSoftware,
  deleteSoftware,
  updateSoftware,
} = require("../controllers/softwareController");
// Get All users
router.get("/software", findAllSoftware);
// Add user
router.post("/software", createSoftware);
// get user by id
router.get("/software/:softwareId", findSoftware);
// update user
router.put("/software/:softwareId", updateSoftware);
// delete user
router.delete("/software/:softwareId", deleteSoftware);

module.exports = router;
