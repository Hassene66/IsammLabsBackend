const mongoose = require("mongoose");

const softwareSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "veuillez entrer le nom de logiciel"],
  },
});

module.exports = mongoose.model("Software", softwareSchema);
