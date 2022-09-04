const admin = require("firebase-admin");
const Claim = require("../models/claimModal");
const sendEmail = require("../services/sendEmail");
const Computer = require("../models/computerModal");
const Notification = require("../models/notificationModal");
const User = require("../models/userModal");
const jsrender = require("jsrender");
const Schedular = require("node-schedule");
const moment = require("moment");

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
        targetScreen: "CLAIM_DETAIL",
        data: claim,
      };
      await Notification.create(notificationData);

      return user;
    })
    .then(async (user) => {
      await admin.messaging().sendMulticast({
        data: { routeName: "CLAIM_DETAIL" },
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
        const momentDate = moment(data?.createdAt);
        const afterTwoDays = moment(data?.createdAt).add(2, "minutes");
        const afterOneWeek = moment(data?.createdAt).add(3, "minutes");
        const AfterElevenDays = moment(data?.createdAt).add(4, "minutes");

        const startingDate = momentDate.format("DD/MM/YYYY");
        const endingDate = afterOneWeek.format("DD/MM/YYYY");

        const remindercron = dateToCron(afterTwoDays.toDate());
        const alertcron = dateToCron(afterOneWeek.toDate());
        const mailcron = dateToCron(AfterElevenDays.toDate());

        Schedular.scheduleJob(remindercron, async function () {
          getPopulatedData(data._id)
            .then(async (claim) => {
              if (claim.status === "unprocessed") {
                await admin.messaging().sendMulticast({
                  data: { routeName: "CLAIM_DETAIL" },
                  tokens: user.fcm_key,
                  notification: {
                    title: "Attention!!",
                    body: `vous avez une réclamation non encore traitée par l'enseignant ${user.fullname}`,
                  },
                });
                const notificationData = {
                  title: "Attention!!",
                  description: `vous avez une réclamation non encore traitée par l'enseignant ${user.fullname}`,
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
        Schedular.scheduleJob(alertcron, async function () {
          getPopulatedData(data?._id)
            .then(async (refetchedClaim) => {
              if (refetchedClaim.status === "unprocessed") {
                await admin.messaging().sendMulticast({
                  data: { routeName: "CLAIM_DETAIL" },
                  tokens: user.fcm_key,
                  notification: {
                    title: "Attention!!",
                    body: `Vous avez une réclamation qui n'a pas encore été prise en charge depuis une semaine soumise par l'enseignant ${user.fullname}`,
                  },
                });
                const notificationData = {
                  title: "Attention!!",
                  description: `Vous avez une réclamation qui n'a pas encore été prise en charge depuis une semaine soumise par l'enseignant ${user.fullname}`,
                  createdBy: claimData.createdBy,
                  assignedTo: claimData.assignedTo,
                  targetScreen: "CLAIM_DETAIL",
                  data: claim,
                };
                await Notification.create(notificationData);
              } else if (refetchedClaim.status === "in_progress") {
                await admin.messaging().sendMulticast({
                  data: { routeName: "CLAIM_DETAIL" },
                  tokens: user.fcm_key,
                  notification: {
                    title: "Avertissement!!",
                    body: `Vous avez une demande inachevée qui a dépassé le délai fixé d'une semaine soumise par l'enseignant ${user.fullname}`,
                  },
                });
                const notificationData = {
                  title: "Avertissement!!",
                  description: `Vous avez une demande inachevée qui a dépassé le délai fixé d'une semaine soumise par l'enseignant ${user.fullname}`,
                  createdBy: claimData.createdBy,
                  assignedTo: claimData.assignedTo,
                  targetScreen: "CLAIM_DETAIL",
                  data: claim,
                };
                await Notification.create(notificationData);
              }
            })
            .catch((err) => {
              console.log(err);
            });
        });
        // code of cron job
        Schedular.scheduleJob(mailcron, async function () {
          getPopulatedData(claim?.id).then(async (refetchedDataMail) => {
            if (
              refetchedDataMail.status !== "resolved" &&
              refetchedDataMail.status !== "not_resolved"
            ) {
              await admin.messaging().sendMulticast({
                data: { routeName: "CLAIM_DETAIL" },
                tokens: user.fcm_key,
                notification: {
                  title: "Réclamation expirée !!",
                  body: `Vous avez une demande inachevée qui a dépassé le délai fixé par 4 jours soumise par l'enseignant ${user.fullname}`,
                },
              });
              const notificationData = {
                title: "Réclamation expirée !!",
                description: `Vous avez une demande inachevée qui a dépassé le délai fixé par 4 jours soumise par l'enseignant ${user.fullname}`,
                createdBy: claimData.createdBy,
                assignedTo: claimData.assignedTo,
                targetScreen: "CLAIM_DETAIL",
                data: claim,
              };
              await Notification.create(notificationData);
              try {
                sendEmail({
                  email: "hassene.ayoub@yahoo.fr",
                  subject: "Expiration délai du réclamation",
                  message,
                });
                console.log("email sent");
              } catch (err) {
                console.log(err);
              }
            }
          });
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
    .populate({
      path: "toUpdateSoftware",
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
let technicianFetchedData = undefined;
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
      if (!claim.isConfirmed) {
        if (req.body.status && req.body.status !== "unprocessed") {
          User.findById(claim?.createdBy)
            .select("+fcm_key")
            .then((teacherUser) => teacherUser)
            .then(async (teacherUser) => {
              User.findById(claim?.assignedTo).then(async (technicianUser) => {
                technicianFetchedData = technicianUser;
                const notificationData = {
                  title: "M-à-j du réclamation",
                  description:
                    req.body.status && req.body.status === "in_progress"
                      ? `Une réclamation est en cours de traitement par le technicien ${technicianUser.fullname}.`
                      : req.body.status && req.body.status === "resolved"
                      ? `Une réclamation est résolu et en attente de votre confirmation.`
                      : req.body.status && req.body.status === "not_resolved"
                      ? `Une demande ne peut pas être résolue et est en attente de votre confirmation.`
                      : "",
                  createdBy: claim.createdBy,
                  assignedTo: claim.assignedTo,
                  targetScreen: "CLAIM_DETAIL",
                  data: claim,
                };
                await Notification.create(notificationData);

                await admin.messaging().sendMulticast({
                  data: { routeName: "CLAIM_DETAIL" },
                  tokens: teacherUser.fcm_key,
                  notification: {
                    title: "M-à-j du réclamation!",
                    body:
                      req.body.status && req.body.status === "in_progress"
                        ? `Une réclamation est en cours de traitement par le technicien ${technicianUser.fullname}.`
                        : req.body.status && req.body.status === "resolved"
                        ? `Une réclamation est résolu par le technicien ${technicianUser.fullname} et en attente de votre confirmation.`
                        : req.body.status && req.body.status === "not_resolved"
                        ? `Une demande ne peut pas être résolue et est en attente de votre confirmation.`
                        : "",
                  },
                });
              });
              if (claim.isApproved !== undefined) {
                if (claim.isApproved) {
                  if (
                    claim.claimType === "software" &&
                    claim.type === "newSoftware"
                  ) {
                    Computer.findByIdAndUpdate(claim?.computer, {
                      $push: { [claim?.installedIn]: [claim?.toAddSoftware] },
                    }).then(async (computer) => {
                      await admin.messaging().sendMulticast({
                        data: { routeName: "CLAIM_DETAIL" },
                        tokens: technicianFetchedData.fcm_key,
                        notification: {
                          title: "Attention!!",
                          body: `Vous avez une réclamation qui n'a pas encore été prise en charge depuis une semaine soumise par l'enseignant ${user.fullname}`,
                        },
                      });
                      const notificationData = {
                        title: "Attention!!",
                        description: `Vous avez une réclamation qui n'a pas encore été prise en charge depuis une semaine soumise par l'enseignant ${user.fullname}`,
                        createdBy: claimData.createdBy,
                        assignedTo: claimData.assignedTo,
                        targetScreen: "CLAIM_DETAIL",
                        data: claim,
                      };
                      await Notification.create(notificationData);
                      res.send(computer);
                    });
                  } else if (
                    claim?.claimType === "hardware" &&
                    claim?.state === "En panne"
                  ) {
                    Computer.findByIdAndUpdate(claim?.computer, {
                      $set: { isWorking: "en marche" },
                    }).then((computer) => {
                      console.log(computer);
                    });
                  }
                }
              }
            });
        }
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
