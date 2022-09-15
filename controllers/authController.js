const crypto = require("crypto");
const User = require("../models/userModal");
// const ErrorResponse = require("../utils/errorResponse");
// const sendEmail = require("../utils/sendEmail");

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    http_only: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  user.password = undefined;
  res.status(statusCode).json({ user, token });
};

exports.register = async (req, res, next) => {
  const { fullname, email, password, role } = req.body;
  if (!fullname || !email || !password || !role) {
    return res
      .status(400)
      .json("Veuillez fournir tous les renseignements requis");
  }
  const ExistingUser = await User.findOne({ email });
  if (ExistingUser) {
    return res
      .status(401)
      .json(
        "Utilisateur existe déjà s’il vous plaît rediriger vers la page de connexion"
      );
  }
  const user = await User.create({
    fullname,
    email,
    password,
    role,
  });
  sendTokenResponse(user, 200, res);
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json("veuillez fournir l'email et le mot de passe");
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res
      .status(401)
      .json("Les informations de connexion fournies sont invalides");
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res
      .status(401)
      .json("Les informations de connexion fournies sont invalides");
  }

  sendTokenResponse(user, 200, res);
};

exports.me = async (req, res) => {
  return res.status(200).json({ success: true });
};
exports.logout = async (req, res) => {
  if (!req.headers?.fcm_key) {
    return res.status(400).send({
      message: "FCM key is not provided",
    });
  }

  // Find and update user with the request body
  User.findByIdAndUpdate(
    req.params.userId,
    { $pull: { fcm_key: req.headers?.fcm_key } },
    { new: true }
  )
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      sendTokenResponse(user, 200, res);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "User not found with id " + req.params.userId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong updating fcm key with id " + req.params.userId,
      });
    });
};

// @desc Reset password
// @route PUT /api/resetpassword/:resettoken
// @acces Public
exports.resetPassword = async (req, res, next) => {
  // get hashed password
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json("Token invalide");
    // set new password
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPassworExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
};

// @desc forget password
// @route Post /api/forgetpassword
// @access public
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json("Pas d'utilisateur avec cet email");
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/resetpassword/${resetToken}`;
  const message = `vous recevez cet e-mail car vous avez demandé la réinitialisation d'un mot de passe, veuillez faire une requête PUT à : \n\n ${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "réinitialiser le mot de passe",
      message,
    });
    res.status(200).json({
      message:
        "Un Email de réinitialisation du mot de passe a été envoyé avec succès ",
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json("Email n'a pas pu être envoyé");
  }
  res.status(200).json({ user });
};

// @update user details
// @route put /api/updatedetails
// @access private

exports.updateDetails = async (req, res) => {
  const fieldToUpdate = {};
  if (req.body.firstName) fieldToUpdate.firstName = req.body.firstName;
  if (req.body.lastName) fieldToUpdate.lastName = req.body.lastName;

  const user = await User.findByIdAndUpdate(req.user.id, fieldToUpdate, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    user,
  });
};
// @desc      Get current logged in user
// @route     GET /api/auth/me
// @access    Private
exports.getMe = async (req, res) => {
  // user is already available in req due to the protect middleware
  const { user } = req;

  res.status(200).json({
    user,
  });
};

// @desc update email
// @route PUT /api/updateemail
// @acces Public

exports.updateEmail = async (req, res, next) => {
  const { user } = req;
  const resetToken = user.getResetEmailToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/resetemail/${resetToken}`;

  const message = `vous recevez cet e-mail car vous avez demandé la réinitialisation de votre email, veuillez faire une requête PUT à : \n\n ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "réinitialiser le mot de passe",
      message,
    });
    res.status(200).json({
      message: "Un Email de réinitialisation de mail a été envoyé avec succès ",
    });
  } catch (err) {
    console.log(err);
    user.resetEmailToken = undefined;
    user.resetEmailExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json("Email n'a pas pu être envoyé");
  }
  res.status(200).json({
    user,
  });
};

// @desc Reset email
// @route PUT /api/resetemail/:resettoken
// @acces Public
exports.resetEmail = async (req, res, next) => {
  // get hashed password
  const resetEmailToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetEmailToken,
    resetEmailExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json("Token invalide");
    // set new password
  }
  user.email = req.body.email;
  user.resetEmailToken = undefined;
  user.resetEmailExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
};

// @update Update password
// @route put /api/updatepassword
// @access private

exports.updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.matchPassword(req.body.currentPassword)))
    return res.status(401).json("le mot de passe est incorrect");

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
};
