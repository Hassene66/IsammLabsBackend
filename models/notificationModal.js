const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "veuillez entrer le titre de la notification"],
    },
    description: {
      type: String,
      required: [true, "veuillez entrer le description de la notification"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetScreen: {
      type: String,
    },
    status: {
      type: String,
      enum: ["viewed", "not viewed"],
      default: "not viewed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
