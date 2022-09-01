const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["newSoftware", "updateSoftware", "hardware"],
      default: "newSoftware",
    },
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Software",
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
    state: {
      type: String,
      enum: ["En marche", "En panne"],
      default: "En marche",
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
