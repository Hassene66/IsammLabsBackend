const User = require("../models/userModal");
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    http_only: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  user.password = undefined;
  res.status(statusCode).json({ user, token });
};

//Create new User
exports.createUser = async (req, res) => {
  // Request validation
  const userData = req.body;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "User content can not be empty",
    });
  }

  // Create a User
  const user = new User(userData);

  // Save User in the database
  user
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while creating the user.",
      });
    });
};

// Retrieve all users from the database.
exports.findAllUser = async (req, res) => {
  const data = req.query;
  User.find(data)
    .then((users) => {
      res.send(users);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while retrieving users.",
      });
    });
};

// Find a single user with a userId
exports.findUser = async (req, res) => {
  User.findById(req.params.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      res.send(user);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      return res.status(500).send({
        message: "Something wrong retrieving user with id " + req.params.userId,
      });
    });
};
// Update a user
exports.updateUser = async (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "User content can not be empty",
    });
  }

  // Find and update user with the request body
  User.findByIdAndUpdate(req.params.userId, req.body, { new: true })
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      sendTokenResponse(user, 200, res);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      return res.status(500).send({
        message: "Something wrong updating note with id " + req.params.userId,
      });
    });
};

exports.updateFcmKey = async (req, res) => {
  // Validate Request
  if (!req.headers?.fcm_key) {
    return res.status(400).send({
      message: "FCM key is not provided",
    });
  }

  // Find and update user with the request body
  User.findByIdAndUpdate(
    req.params.userId,
    { $addToSet: { fcm_key: req.headers?.fcm_key } },
    { new: true }
  )
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      sendTokenResponse(user, 200, res);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong updating fcm key with id " + req.params.userId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteUser = async (req, res) => {
  User.findByIdAndRemove(req.params.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      res.send({ message: "User deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      return res.status(500).send({
        message: "Could not delete user with id " + req.params.userId,
      });
    });
};
