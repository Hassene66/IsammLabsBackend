const admin = require("firebase-admin");
const Claim = require("../models/claimModal");
const sendEmail = require("../services/sendEmail");
const Notification = require("../models/notificationModal");
const User = require("../models/userModal");
const jsrender = require("jsrender");
const Schedular = require("node-schedule");
const { DateTime } = require("luxon");

const dateToCron = (date) => {
  const minutes = date.getMinutes();
  const hours = date.getHours();
  const days = date.getDate();
  const months = date.getMonth() + 1;
  console.log(`${minutes} ${hours} ${days} ${months} ${"*"}`);
  return `${minutes} ${hours} ${days} ${months} ${"*"}`;
};
function addMinutes(numOfMinutes, date = new Date()) {
  date.setMinutes(date.getMinutes() + numOfMinutes);

  return date;
}
const template = jsrender.templates("./template/index3.html");
//Create new Claim
exports.createClaim = async (req, res) => {
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
    .then((user) => {
      admin.messaging().sendMulticast({
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
      TechnicianData.fullname = user?.fullname;
      TechnicianData.email = user?.email;
      const notificationData = {
        title: "Nouvelle réclamation!",
        description: `${user.fullname} vous a ajouté une nouvelle demande de réparation`,
        createdBy: claimData.createdBy,
        assignedTo: claimData.assignedTo,
        targetScreen: "To repair",
      };
      return Notification.create(notificationData);
    })
    .then(
      () => {
        claim.save().then((data) => {
          Claim.findById(data._id)
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
            .exec((err, populatedData) => {
              console.log(populatedData);
              populData = populatedData;
              message = template.render({
                Tech_fullName: TechnicianData?.fullname,
                Prof_fullName: teacherData?.fullname,
                Claim_data: populData,
                Prof_email: teacherData?.email,
                Tech_email: TechnicianData?.email,
              });
              const formattedDate = DateTime.fromISO(
                populData?.createdAt
              ).setLocale("fr");
              console.log(formattedDate.toFormat("F"));

              // Date_Reclamation: DateTime.fromISO(
              //   data?.createdAt
              // ).toLocaleString(),
            });
          // add a week to the current date
          let date = new Date(data?.createdAt);
          const startingDate = DateTime.fromISO(data?.createdAt);
          console.log(startingDate);
          // format the date using luxon
          const endingDate = startingDate.plus({ days: 7 });
          console.log("starting Date", startingDate);
          console.log("ending Date", endingDate);
          // convert to cron time
          const cron = dateToCron(addMinutes(1, date));
          Schedular.scheduleJob(cron, async function () {
            try {
              sendEmail({
                email: "marwen.ayoub@outlook.com",
                subject: "Expiration délai du réclamation",
                message,
              });
              console.log("email sent");
            } catch (err) {
              return next(
                new ErrorResponse("Email n'a pas pu être envoyé", 500)
              );
            }
          });
          return res.send(data);
        });
      }
      // claim.save().then((data) => {

      //   const message = template.render({
      //     Tech_fullName: TechnicianData.fullname,
      //     Prof_fullName: teacherData.fullName,
      //   });
      //   sendEmail({
      //     email: "marwen.ayoub@outlook.com",
      //     subject: "Expiration délai du réclamation",
      //     message,
      //   });
      //   return res.send(data);
      // })
    )
    .catch((err) => {
      return res.status(500).send({
        message: err.message || "Something wrong while creating the claim.",
      });
    });
};

// Retrieve all claims from the database.
exports.findAllClaims = async (req, res) => {
  const data = req.query;
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
