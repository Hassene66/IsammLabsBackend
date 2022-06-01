const mongoose = require("mongoose");

const blocSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, "veuillez entrer la label de bloc"],
  },
  labs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laboratory",
    },
  ],
});

module.exports = mongoose.model("Bloc", blocSchema);
