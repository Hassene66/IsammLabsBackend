const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
//protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res
      .status(401)
      .json("Vous n'êtes pas autorisé(e) à accéder à cette page");
  }
  try {
    //   verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res
      .status(401)
      .json("Vous n'êtes pas autorisé(e) à accéder à cette page");
  }
};
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json("Vous n'êtes pas autorisé(e) à faire cette action");
    }
    next();
  };
};
