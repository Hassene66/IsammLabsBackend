const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
  console.log("Err :" + err.message);
  let error = { message: err.message, ...err };
  //Mongoose bad objectId
  if (err.name === "CastError") {
    let message = `Données non trouvées avec l’id spécifié`;
    error = new ErrorResponse(message, 404);
  }
  //   Mongoose duplicate key
  if (err.code === 11000) {
    const message = `La valeur entrée de ${Object.keys(
      err.keyValue
    )} est déja attribuée.`;
    error = new ErrorResponse(message, 400);
  }
  //   Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(message, 400);
  }
  return res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Erreur de serveur",
  });
};
module.exports = errorHandler;
