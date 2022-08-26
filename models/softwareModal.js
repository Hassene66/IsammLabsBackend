const mongoose = require("mongoose");

const softwareSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      lowercase: true,
      required: [true, "veuillez entrer le nom de logiciel"],
    },
  },
  {
    runSettersOnQuery: true,
  }
);
softwareSchema.pre("save", function (next) {
  this.name = this.name.toLowerCase();
  next();
});
module.exports = mongoose.model("Software", softwareSchema);
