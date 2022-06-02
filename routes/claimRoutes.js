const router = require("express").Router();
const {
  findAllClaims,
  createClaim,
  findClaim,
  deleteClaim,
  updateClaim,
} = require("../controllers/claimController");
// Get All users
router.get("/claim", findAllClaims);
// Add user
router.post("/claim", createClaim);
// get user by id
router.get("/claim/:claimId", findClaim);
// update user
router.put("/claim/:claimId", updateClaim);
// delete user
router.delete("/claim/:claimId", deleteClaim);

module.exports = router;
