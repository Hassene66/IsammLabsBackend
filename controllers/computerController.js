const Computer = require("../models/computerModal");

//Create new Computer
exports.createComputer = (req, res) => {
  // Request validation
  const computerData = req.body;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Computer content can not be empty",
    });
  }

  // Create a Computer
  const computer = new Computer(computerData);

  // Save Computer in the database
  computer
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while creating the computer.",
      });
    });
};

// Retrieve all computers from the database.
exports.findAllComputers = (req, res) => {
  const data = req.query;
  Computer.find(data)
    .populate("softwareInstalled")
    .then((computers) => {
      res.send(computers);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while retrieving computers.",
      });
    });
};

// Find a single computer with a computerId
exports.findComputer = (req, res) => {
  Computer.findById(req.params.computerId)
    .then((computer) => {
      if (!computer) {
        return res.status(404).send({
          message: "Computer not found with id " + req.params.computerId,
        });
      }
      res.send(computer);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Computer not found with id " + req.params.computerId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong retrieving computer with id " +
          req.params.computerId,
      });
    });
};
// Update a computer
exports.updateComputer = (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Computer content can not be empty",
    });
  }

  // Find and update computer with the request body
  Computer.findByIdAndUpdate(req.params.computerId, req.body, { new: true })
    .then((computer) => {
      if (!computer) {
        return res.status(404).send({
          message: "Computer not found with id " + req.params.computerId,
        });
      }
      sendTokenResponse(computer, 200, res);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Computer not found with id " + req.params.computerId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong updating note with id " + req.params.computerId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteComputer = (req, res) => {
  Computer.findByIdAndRemove(req.params.computerId)
    .then((computer) => {
      if (!computer) {
        return res.status(404).send({
          message: "Computer not found with id " + req.params.computerId,
        });
      }
      res.send({ message: "Computer deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "Computer not found with id " + req.params.computerId,
        });
      }
      return res.status(500).send({
        message: "Could not delete computer with id " + req.params.computerId,
      });
    });
};
