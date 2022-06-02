const Claim = require("../models/claimModal");

//Create new Claim
exports.createClaim = (req, res) => {
  // Request validation
  const claimData = req.body;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Claim content can not be empty",
    });
  }

  // Create a Claim
  const claim = new Claim(claimData);

  // Save Claim in the database
  claim
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while creating the claim.",
      });
    });
};

// Retrieve all claims from the database.
exports.findAllClaims = (req, res) => {
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
exports.findClaim = (req, res) => {
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
exports.updateClaim = (req, res) => {
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
      sendTokenResponse(claim, 200, res);
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
exports.deleteClaim = (req, res) => {
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
