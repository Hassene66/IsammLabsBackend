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
    pc: string,
    ip: String,
    ram: String,
    storage: String,
    cpu: String,
    gpu: String,
  },
  isWorking: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Computer", computerSchema);
