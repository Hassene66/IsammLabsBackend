const mongoose = require("mongoose");
const isEmail = require("validator/lib/isEmail");

const claimSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "veuillez entrer le tire de reclamation"],
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
  description: {
    type: string,
  },
  toAddSoftware: {
    type: String,
  },
  toUpdateSoftware: {
    type: String,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: [true, "l'email doit être unique"],
    required: "l'adresse email est obligatoire",
    validate: [isEmail, "veuillez saisir une adresse e-mail valide"],
  },
  role: {
    type: String,
    enum: ["enseignant", "technicien"],
    default: "enseignant",
  },
  password: {
    type: String,
    required: [true, "veuillez entrer le mot de passe"],
    minlength: [6, "le mot de passe doit comporter au moins 6 caractères"],
    select: false,
  },
});

module.exports = mongoose.model("Claim", claimSchema);
