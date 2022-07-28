const mongoose = require("mongoose");

const computerSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, "veuillez entrer le nom de l'oradinateur"],
  },
  softwareInstalled: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Software",
    },
  ],
  characteristics: {
    ip: String,
    ram: String,
    proccessor: String,
    storage: String,
    os: String,
  },
  isWorking: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Computer", computerSchema);
