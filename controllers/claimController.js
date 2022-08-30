const admin = require("firebase-admin");
const Claim = require("../models/claimModal");
const sendEmail = require("../services/sendEmail");
const Notification = require("../models/notificationModal");
const User = require("../models/userModal");
const jsrender = require("jsrender");
const Schedular = require("node-schedule");
const moment = require("moment");
const ErrorResponse = require("../utils/errorResponse");

const dateToCron = (date) => {
  const minutes = date.getMinutes();
  const hours = date.getHours();
  const days = date.getDate();
  const months = date.getMonth() + 1;
  console.log(`${minutes} ${hours} ${days} ${months} ${"*"}`);
  return `${minutes} ${hours} ${days} ${months} ${"*"}`;
};
const template = jsrender.templates("./template/index3.html");

function addMinutes(numOfMinutes, date = new Date()) {
  date.setMinutes(date.getMinutes() + numOfMinutes);

  return date;
}

function getPopulatedData(id) {
  return Claim.findById(id)
    .populate({
      path: "computer",
      model: "Computer",
    })
    .populate({
      path: "labo",
      model: "Laboratory",
    })
    .populate({
      path: "bloc",
      model: "Bloc",
    })
    .populate({
      path: "createdBy",
      model: "User",
    })
    .exec();
}

//Create new Claim
exports.createClaim = async (req, res, next) => {
  // Request validation
  const claimData = req.body;
  let TechnicianData = {};
  let teacherData = {};
  let populData = null;
  let message = {};
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Claim content can not be empty",
    });
  }
  User.findById(claimData.createdBy).then((teacherUser) => {
    teacherData.fullname = teacherUser?.fullname;
    teacherData.email = teacherUser?.email;
  });
  // Create a Claim
  const claim = new Claim(claimData);

  User.findById(claimData.assignedTo)
    .select("+fcm_key")
    .then(async (user) => {
      TechnicianData.fullname = user?.fullname;
      TechnicianData.email = user?.email;
      const notificationData = {
        title: "Nouvelle réclamation!",
        description: `${user.fullname} vous a ajouté une nouvelle demande de réparation`,
        createdBy: claimData.createdBy,
        assignedTo: claimData.assignedTo,
        targetScreen: "TO_REPAIR",
      };
      await Notification.create(notificationData);

      return user;
    })
    .then(async (user) => {
      await admin.messaging().sendMulticast({
        data: { routeName: "TO_REPAIR" },
        tokens: user.fcm_key,
        notification: {
          title: "Nouvelle réclamation!",
          body: `${user.fullname} vous a ajouté une nouvelle demande de réparation`,
        },
      });
      return user;
    })
    .then((user) => {
      claim.save().then(async (data) => {
        getPopulatedData(data._id).then((populatedData) => {
          populData = populatedData;
          // console.log("populatedData: ", populatedData);
          message = template.render({
            Tech_fullName: TechnicianData?.fullname,
            Prof_fullName: teacherData?.fullname,
            Claim_data: populData,
            Prof_email: teacherData?.email,
            Tech_email: TechnicianData?.email,
            Claim_Start_date: startingDate,
            Claim_end_date: endingDate,
            Date_now: moment().format("DD/MM/YYYY"),
          });
        });
        // add a week to the current date
        let date = new Date(data?.createdAt);
        const momentDate = moment(data?.createdAt);
        const startingDate = momentDate.format("DD/MM/YYYY");
        // format the date using luxon
        const momentEndingDate = momentDate.add(7, "d");
        const endingDate = momentEndingDate.format("DD/MM/YYYY");
        // convert to cron time
        const mailcron = dateToCron(addMinutes(1, date));
        const alertcron = dateToCron(addMinutes(1, date));
        Schedular.scheduleJob(alertcron, async function () {
          getPopulatedData(data._id)
            .then(async (claim) => {
              if (claim.status === "unprocessed") {
                await admin.messaging().sendMulticast({
                  data: { routeName: "TO_REPAIR" },
                  tokens: user.fcm_key,
                  notification: {
                    title: "Attention!!",
                    body: `vous avez une réclamation non traitée envoyée par l'enseignent ${user.fullname}`,
                  },
                });
                const notificationData = {
                  title: "Attention!!",
                  description: `vous avez une réclamation non traitée envoyée par le l'enseignent ${user.fullname}`,
                  createdBy: claimData.createdBy,
                  assignedTo: claimData.assignedTo,
                  targetScreen: "CLAIM_DETAIL",
                  data: claim,
                };
                await Notification.create(notificationData);
              }
            })
            .catch((err) => console.log(err));
        });
        Schedular.scheduleJob(mailcron, async function () {
          try {
            await sendEmail({
              email: "hassene.ayoub@yahoo.fr",
              subject: "Expiration délai du réclamation",
              message,
            });
            console.log("email sent");
          } catch (err) {
            console.log("Email n'a pas pu être envoyé");
          }
        });
        return res.send(data);
      });
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || "Something wrong while creating the claim.",
      });
    });
};

// Retrieve all claims from the database.
exports.findAllClaims = async (req, res) => {
  const data = req.query;
  let skip = undefined;
  let limit = undefined;
  if (data?.offset && data?.size) {
    skip = (data?.offset - 1) * data?.size;
    limit = data?.size;
  }
  Claim.find(data)
    .sort("-createdAt")
    .populate({
      path: "computer",
      model: "Computer",
    })
    .populate({
      path: "labo",
      model: "Laboratory",
    })
    .populate({
      path: "bloc",
      model: "Bloc",
    })
    .populate({
      path: "computer",
      model: "Computer",
    })
    .populate({
      path: "createdBy",
      model: "User",
    })
    .populate({
      path: "toAddSoftware",
      model: "Software",
    })
    .skip(skip)
    .limit(limit)
    .exec()
    .then((claims) => {
      res.send(claims);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while retrieving claims.",
      });
    });
};

// Find a single claim with a claimId
exports.findClaim = async (req, res) => {
  Claim.findById(req.params.claimId)
    .then((claim) => {
      if (!claim) {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      res.send(claim);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong retrieving claim with id " + req.params.claimId,
      });
    });
};
// Update a claim
exports.updateClaim = async (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Claim content can not be empty",
    });
  }

  // Find and update claim with the request body
  Claim.findByIdAndUpdate(req.params.claimId, req.body, { new: true })
    .then((claim) => {
      if (!claim) {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      return res.send(claim);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      return res.status(500).send({
        message: "Something wrong updating note with id " + req.params.claimId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteClaim = async (req, res) => {
  Claim.findByIdAndRemove(req.params.claimId)
    .then((claim) => {
      if (!claim) {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      res.send({ message: "Claim deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "Claim not found with id " + req.params.claimId,
        });
      }
      return res.status(500).send({
        message: "Could not delete claim with id " + req.params.claimId,
      });
    });
};
