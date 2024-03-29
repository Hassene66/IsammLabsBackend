const Bloc = require("../models/blocModal");

//Create new Bloc
exports.createBloc = async (req, res) => {
  // Request validation
  const blocData = req.body;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Bloc content can not be empty",
    });
  }

  // Create a Bloc
  const bloc = new Bloc(blocData);

  // Save Bloc in the database
  bloc
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while creating the bloc.",
      });
    });
};

// Retrieve all blocs from the database.
exports.findAllBlocs = async (req, res) => {
  const data = req.query;
  Bloc.find(data)
    .populate("labs")
    .populate({
      path: "labs",
      populate: [
        {
          path: "computer",
          populate: [
            {
              path: "windows",
              modal: "Software",
            },
            {
              path: "linux",
              modal: "Software",
            },
            {
              path: "macos",
              modal: "Software",
            },
          ],
          modal: "Computer",
        },
      ],
    })
    .then((blocs) => {
      res.send(blocs);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while retrieving blocs.",
      });
    });
};

// Find a single bloc with a blocId
exports.findBloc = async (req, res) => {
  Bloc.findById(req.params.blocId)
    .then((bloc) => {
      if (!bloc) {
        return res.status(404).send({
          message: "Bloc not found with id " + req.params.blocId,
        });
      }
      res.send(bloc);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Bloc not found with id " + req.params.blocId,
        });
      }
      return res.status(500).send({
        message: "Something wrong retrieving bloc with id " + req.params.blocId,
      });
    });
};
// Update a bloc
exports.updateBloc = async (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Bloc content can not be empty",
    });
  }

  // Find and update bloc with the request body
  Bloc.findByIdAndUpdate(req.params.blocId, req.body, { new: true })
    .then((bloc) => {
      if (!bloc) {
        return res.status(404).send({
          message: "Bloc not found with id " + req.params.blocId,
        });
      }
      return res.status(200).send({ message: "Bloc updated succesfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Bloc not found with id " + req.params.blocId,
        });
      }
      return res.status(500).send({
        message: "Something wrong updating bloc with id " + req.params.blocId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteBloc = async (req, res) => {
  Bloc.findByIdAndRemove(req.params.blocId)
    .then((bloc) => {
      if (!bloc) {
        return res.status(404).send({
          message: "Bloc not found with id " + req.params.blocId,
        });
      }
      res.send({ message: "Bloc deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "Bloc not found with id " + req.params.blocId,
        });
      }
      return res.status(500).send({
        message: "Could not delete bloc with id " + req.params.blocId,
      });
    });
};
