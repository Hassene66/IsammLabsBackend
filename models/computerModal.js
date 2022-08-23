const mongoose = require("mongoose");

const computerSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, "veuillez entrer le nom de l'oradinateur"],
  },
  macos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Software",
    },
  ],
  windows: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Software",
    },
  ],
  linux: [
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
  },
  isWorking: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Computer", computerSchema);
