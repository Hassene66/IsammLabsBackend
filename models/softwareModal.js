const mongoose = require("mongoose");

const softwareSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "veuillez entrer le nom de logiciel"],
  },
  InstalledIn: {
    type: String,
    required: [true, "veuillez spécifier le systéme d'exploitation"],
    enum: ["MacOS", "Windows", "Linux"],
    default: "Windows",
  },
  state: {
    type: String,
    enum: ["installed", "missing", "repair"],
    required: true,
    default: "installed",
  
  },
});

module.exports = mongoose.model("Software", softwareSchema);
