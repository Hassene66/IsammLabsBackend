const mongoose = require("mongoose");
const isEmail = require("validator/lib/isEmail");

const claimSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "veuillez entrer le tire de reclamation"],
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
      type: String,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
