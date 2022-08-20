const Laboratory = require("../models/laboratoryModal");

//Create new Laboratory
exports.createLaboratory = async (req, res) => {
  // Request validation
  const laboratoryData = req.body;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Laboratory content can not be empty",
    });
  }

  // Create a Laboratory
  const laboratory = new Laboratory(laboratoryData);

  // Save Laboratory in the database
  laboratory
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Something wrong while creating the laboratory.",
      });
    });
};

// Retrieve all laboratorys from the database.
exports.findAllLaboratorys = async (req, res) => {
  const data = req.query;
  Laboratory.find(data)
    .then((laboratorys) => {
      res.send(laboratorys);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while retrieving laboratorys.",
      });
    });
};

// Find a single laboratory with a laboratoryId
exports.findLaboratory = async (req, res) => {
  Laboratory.findById(req.params.laboratoryId)
    .then((laboratory) => {
      if (!laboratory) {
        return res.status(404).send({
          message: "Laboratory not found with id " + req.params.laboratoryId,
        });
      }
      res.send(laboratory);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Laboratory not found with id " + req.params.laboratoryId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong retrieving laboratory with id " +
          req.params.laboratoryId,
      });
    });
};
// Update a laboratory
exports.updateLaboratory = async (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Laboratory content can not be empty",
    });
  }

  // Find and update laboratory with the request body
  Laboratory.findByIdAndUpdate(req.params.laboratoryId, req.body, { new: true })
    .then((laboratory) => {
      if (!laboratory) {
        return res.status(404).send({
          message: "Laboratory not found with id " + req.params.laboratoryId,
        });
      }
      sendTokenResponse(laboratory, 200, res);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Laboratory not found with id " + req.params.laboratoryId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong updating note with id " + req.params.laboratoryId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteLaboratory = async (req, res) => {
  Laboratory.findByIdAndRemove(req.params.laboratoryId)
    .then((laboratory) => {
      if (!laboratory) {
        return res.status(404).send({
          message: "Laboratory not found with id " + req.params.laboratoryId,
        });
      }
      res.send({ message: "Laboratory deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "Laboratory not found with id " + req.params.laboratoryId,
        });
      }
      return res.status(500).send({
        message:
          "Could not delete laboratory with id " + req.params.laboratoryId,
      });
    });
};
