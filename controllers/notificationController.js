const Notification = require("../models/notificationModal");

//Create new Notification
exports.createNotification = (req, res) => {
  // Request validation
  const notificationData = req.body;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Notification content can not be empty",
    });
  }

  // Create a Notification
  const notification = new Notification(notificationData);

  // Save Notification in the database
  notification
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Something wrong while creating the notification.",
      });
    });
};

// Retrieve all notifications from the database.
exports.findAllNotifications = (req, res) => {
  const data = req.query;
  Notification.find(data)
    .populate(["assignedTo", "createdBy"])
    .sort("-createdAt")
    .then((notifications) => {
      res.send(notifications);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Something wrong while retrieving notifications.",
      });
    });
};

// Find a single notification with a notificationId
exports.findNotification = (req, res) => {
  Notification.findById(req.params.notificationId)
    .then((notification) => {
      if (!notification) {
        return res.status(404).send({
          message:
            "Notification not found with id " + req.params.notificationId,
        });
      }
      res.send(notification);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message:
            "Notification not found with id " + req.params.notificationId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong retrieving notification with id " +
          req.params.notificationId,
      });
    });
};
// Update a notification
exports.updateNotification = (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Notification content can not be empty",
    });
  }

  // Find and update notification with the request body
  Notification.findByIdAndUpdate(req.params.notificationId, req.body, {
    new: true,
  })
    .then((notification) => {
      if (!notification) {
        return res.status(404).send({
          message:
            "Notification not found with id " + req.params.notificationId,
        });
      }
      return res.send(notification);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message:
            "Notification not found with id " + req.params.notificationId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong updating notification with id " +
          req.params.notificationId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteNotification = (req, res) => {
  Notification.findByIdAndRemove(req.params.notificationId)
    .then((notification) => {
      if (!notification) {
        return res.status(404).send({
          message:
            "Notification not found with id " + req.params.notificationId,
        });
      }
      res.send({ message: "Notification deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message:
            "Notification not found with id " + req.params.notificationId,
        });
      }
      return res.status(500).send({
        message:
          "Could not delete notification with id " + req.params.notificationId,
      });
    });
};
