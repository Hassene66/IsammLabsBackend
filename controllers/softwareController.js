const Software = require("../models/softwareModal");

//Create new Software
exports.createSoftware = (req, res) => {
  // Request validation
  const softwareData = req.body;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Software content can not be empty",
    });
  }

  // Create a Software
  const software = new Software(softwareData);

  // Save Software in the database
  software
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while creating the software.",
      });
    });
};

// Retrieve all softwares from the database.
exports.findAllSoftware = (req, res) => {
  const data = req.query;
  Software.find(data)
    .sort("+name")
    .then((softwares) => {
      res.send(softwares);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while retrieving softwares.",
      });
    });
};

// Find a single software with a softwareId
exports.findSoftware = (req, res) => {
  Software.findById(req.params.softwareId)
    .then((software) => {
      if (!software) {
        return res.status(404).send({
          message: "Software not found with id " + req.params.softwareId,
        });
      }
      res.send(software);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Software not found with id " + req.params.softwareId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong retrieving software with id " +
          req.params.softwareId,
      });
    });
};
// Update a software
exports.updateSoftware = (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Software content can not be empty",
    });
  }

  // Find and update software with the request body
  Software.findByIdAndUpdate(req.params.softwareId, req.body, { new: true })
    .then((software) => {
      if (!software) {
        return res.status(404).send({
          message: "Software not found with id " + req.params.softwareId,
        });
      }
      return res.send(software);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Software not found with id " + req.params.softwareId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong updating software with id " + req.params.softwareId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteSoftware = (req, res) => {
  Software.findByIdAndRemove(req.params.softwareId)
    .then((software) => {
      if (!software) {
        return res.status(404).send({
          message: "Software not found with id " + req.params.softwareId,
        });
      }
      res.send({ message: "Software deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "Software not found with id " + req.params.softwareId,
        });
      }
      return res.status(500).send({
        message: "Could not delete software with id " + req.params.softwareId,
      });
    });
};
