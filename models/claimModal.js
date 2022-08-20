const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "veuillez entrer le titre de réclamation"],
    },
    description: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    labo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laboratory",
    },
    claimType: {
      type: String,
      enum: ["software", "hardware"],
    },
    toAddSoftware: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Software",
    },
    installedIn: {
      type: String,
      enum: ["windows", "linux", "macos"],
    },
    toUpdateSoftware: {
      type: String,
    },
    bloc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bloc",
    },
    computer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Computer",
    },
    status: {
      type: String,
      enum: ["unprocessed", "in_progress", "resolved", "not_resolved"],
      default: "unprocessed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
