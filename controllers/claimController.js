const admin = require("firebase-admin");
const Claim = require("../models/claimModal");
const User = require("../models/userModal");
//Create new Claim
exports.createClaim = async (req, res) => {
  // Request validation
  const claimData = req.body;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Claim content can not be empty",
    });
  }
  // Create a Claim
  const claim = new Claim(claimData);
  User.findById(claimData.assignedTo)
    .select("+fcm_key")
    .then((user) =>
      admin.messaging().sendMulticast({
        data: { routeName: "TO_REPAIR" },
        tokens: user.fcm_key,
        notification: {
          title: "Nouvelle réclamation!",
          body: "vous avez une nouvelle réclamation à réparer",
        },
      })
    )
    .then(() =>
      claim.save().then((data) => {
        res.send(data);
      })
    )
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while creating the claim.",
      });
    });
};

// Retrieve all claims from the database.
exports.findAllClaims = async (req, res) => {
  const data = req.query;
  Claim.find(data)
    .sort("-createdAt")
    .populate({
      path: "computer",
      model: "Computer",
    })
    .populate({
      path: "labo",
      model: "Laboratory",
    })
    .populate({
      path: "bloc",
      model: "Bloc",
    })
    .populate({
      path: "computer",
      model: "Computer",
    })
    .populate({
      path: "createdBy",
      model: "User",
    })
    .exec()
    .then((claims) => {
      res.send(claims);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while retrieving claims.",
      });
    });
};

// Find a single claim with a claimId
exports.findClaim = async (req, res) => {
  Claim.findById(req.params.claimId)
    .then((claim) => {
      if (!claim) {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      res.send(claim);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong retrieving claim with id " + req.params.claimId,
      });
    });
};
// Update a claim
exports.updateClaim = async (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Claim content can not be empty",
    });
  }

  // Find and update claim with the request body
  Claim.findByIdAndUpdate(req.params.claimId, req.body, { new: true })
    .then((claim) => {
      if (!claim) {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      return res.send(claim);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      return res.status(500).send({
        message: "Something wrong updating note with id " + req.params.claimId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteClaim = async (req, res) => {
  Claim.findByIdAndRemove(req.params.claimId)
    .then((claim) => {
      if (!claim) {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      res.send({ message: "Claim deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      return res.status(500).send({
        message: "Could not delete claim with id " + req.params.claimId,
      });
    });
};
