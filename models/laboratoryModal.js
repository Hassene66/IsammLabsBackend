const mongoose = require("mongoose");

const laboratorySchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, "veuillez entrer la label de laboratoire"],
  },
  computer: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Computer",
    },
  ],
});

module.exports = mongoose.model("Laboratory", laboratorySchema);
