const router = require("express").Router();
const {
  findAllLaboratorys,
  createLaboratory,
  findLaboratory,
  deleteLaboratory,
  updateLaboratory,
} = require("../controllers/laboratoryController");
// Get All users
router.get("/laboratory", findAllLaboratorys);
// Add user
router.post("/laboratory", createLaboratory);
// get user by id
router.get("/laboratory/:laboratoryId", findLaboratory);
// update user
router.put("/laboratory/:laboratoryId", updateLaboratory);
// delete user
router.delete("/laboratory/:laboratoryId", deleteLaboratory);

module.exports = router;
