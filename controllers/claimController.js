const admin = require("firebase-admin");
const Claim = require("../models/claimModal");
const sendEmail = require("../services/sendEmail");
const Computer = require("../models/computerModal");
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
  return `${minutes} ${hours} ${days} ${months} ${"*"}`;
};
const template = jsrender.templates("./template/index3.html");

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
    .populate({
      path: "assignedTo",
      model: "User",
    })
    .exec();
}

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
  User.findById(claimData.createdBy)
    .select("+fcm_key")
    .then(async (teacherUser) => {
      const techUser = await User.findById(claimData.assignedTo).select(
        "+fcm_key"
      );
      return [teacherUser, techUser];
    })
    .then(async ([teacherUser, techUser]) => {
      teacherData.fullname = teacherUser?.fullname;
      teacherData.email = teacherUser?.email;
      TechnicianData.fullname = techUser?.fullname;
      TechnicianData.email = techUser?.email;

      return [teacherUser, techUser];
    })
    .then(([teacherUser, techUser]) => {
      const claim = new Claim(claimData);
      claim.save().then(async (data) => {
        getPopulatedData(data._id).then(async (populatedData) => {
          populData = populatedData;
          // console.log("populatedData: ", populatedData);
          message = template.render({
            Tech_fullName: techUser?.fullname,
            Prof_fullName: teacherUser?.fullname,
            Claim_data: populData,
            Prof_email: teacherUser?.email,
            Tech_email: techUser?.email,
            Claim_Start_date: startingDate,
            Claim_end_date: endingDate,
            Date_now: moment().format("DD/MM/YYYY"),
          });
          const notificationData = {
            title: "Nouvelle réclamation!",
            description: `${teacherUser.fullname} vous a ajouté une nouvelle demande de réparation`,
            createdBy: claimData.createdBy,
            assignedTo: claimData.assignedTo,
            targetScreen: "CLAIM_DETAIL",
            data: populatedData,
          };
          await Notification.create(notificationData);

          await admin.messaging().sendMulticast({
            data: { routeName: "CLAIM_DETAIL" },
            tokens: techUser.fcm_key,
            notification: {
              title: "Nouvelle réclamation!",
              body: `${teacherUser.fullname} vous a ajouté une nouvelle demande de réparation`,
            },
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
                  tokens: techUser.fcm_key,
                  notification: {
                    title: "Attention!!",
                    body: `vous avez une réclamation non encore traitée issue par l'enseignant ${teacherData.fullname}`,
                  },
                });

                const notificationData = {
                  title: "Attention!!",
                  description: `vous avez une réclamation non encore traitée issue par l'enseignant ${teacherData.fullname}`,
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
                  tokens: techUser.fcm_key,
                  notification: {
                    title: "Attention!!",
                    body: `Vous avez une réclamation qui n'a pas encore été prise en charge depuis une semaine soumise par l'enseignant ${teacherUser.fullname}`,
                  },
                });
                const notificationData = {
                  title: "Attention!!",
                  description: `Vous avez une réclamation qui n'a pas encore été prise en charge depuis une semaine soumise par l'enseignant ${teacherUser.fullname}`,
                  createdBy: claimData.createdBy,
                  assignedTo: claimData.assignedTo,
                  targetScreen: "CLAIM_DETAIL",
                  data: refetchedClaim,
                };
                await Notification.create(notificationData);
              } else if (refetchedClaim.status === "in_progress") {
                await admin.messaging().sendMulticast({
                  data: { routeName: "CLAIM_DETAIL" },
                  tokens: techUser?.fcm_key,
                  notification: {
                    title: "Avertissement!!",
                    body: `Vous avez une demande inachevée qui a dépassé le délai fixé d'une semaine soumise par l'enseignant ${teacherUser.fullname}`,
                  },
                });
                const notificationData = {
                  title: "Avertissement!!",
                  description: `Vous avez une demande inachevée qui a dépassé le délai fixé d'une semaine soumise par l'enseignant ${teacherUser.fullname}`,
                  createdBy: claimData.createdBy,
                  assignedTo: claimData.assignedTo,
                  targetScreen: "CLAIM_DETAIL",
                  data: refetchedClaim,
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
              refetchedDataMail?.status !== "resolved" &&
              refetchedDataMail?.status !== "not_resolved"
            ) {
              await admin.messaging().sendMulticast({
                data: { routeName: "CLAIM_DETAIL" },
                tokens: techUser.fcm_key,
                notification: {
                  title: "Réclamation expirée !!",
                  body: `Vous avez une demande inachevée qui a dépassé le délai fixé par 4 jours soumise par l'enseignant ${teacherUser.fullname}`,
                },
              });
              const notificationData = {
                title: "Réclamation expirée !!",
                description: `Vous avez une demande inachevée qui a dépassé le délai fixé par 4 jours soumise par l'enseignant ${teacherUser.fullname}`,
                createdBy: claimData.createdBy,
                assignedTo: claimData.assignedTo,
                targetScreen: "CLAIM_DETAIL",
                data: refetchedDataMail,
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
      path: "assignedTo",
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

exports.updateClaim = async (req, res, next) => {
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
        return new ErrorResponse(
          "Claim not found with id " + req.params.claimId,
          404
        );
      }
      return claim;
    })
    .then(async (claim) => {
      if (claim?.status !== "unprocessed") {
        try {
          const teacher = await User.findById(claim?.createdBy).select(
            "+fcm_key"
          );
          const technicien = await User.findById(claim?.assignedTo).select(
            "+fcm_key"
          );
          return [claim, teacher, technicien];
        } catch (error) {
          return new ErrorResponse(
            "Une erreur s'est produite pendant l'exécution de l'opération de mise a jour de la réclamation " +
              req.params.claimId,
            500
          );
        }
      }
    })
    .then(async ([claim, teacher, technicien]) => {
      try {
        if (claim?.isConfirmed === false || claim?.isConfirmed === undefined) {
          function conditionalDescription() {
            if (claim?.status === "in_progress")
              return `Une réclamation est en cours de traitement par le technicien ${technicien?.fullname}.`;
            else if (claim.isConfirmed === false && claim.status === "resolved")
              return `Une réclamation est résolu par le technicien ${technicien?.fullname} et en attente de votre confirmation.`;
            else if (
              claim.isConfirmed === false &&
              claim.status === "not_resolved"
            )
              return `Une demande ne peut pas être résolue et est en attente de votre confirmation.`;
            return "";
          }

          const description = conditionalDescription();

          await admin.messaging().sendMulticast({
            data: { routeName: "CLAIM_DETAIL" },
            tokens: teacher?.fcm_key,
            notification: {
              title: "M-à-j du réclamation",
              body: description,
            },
          });

          const notificationData = {
            title: "M-à-j du réclamation",
            description,
            assignedTo: claim?.createdBy,
            targetScreen: "CLAIM_DETAIL",
            data: claim,
          };
          await Notification.create(notificationData);
        }
        if (claim?.isApproved === true && claim?.isConfirmed === true) {
          if (claim?.type === "newSoftware") {
            await Computer.findByIdAndUpdate(claim?.computer, {
              $addToSet: {
                [claim?.installedIn]: [claim?.toAddSoftware],
              },
            });

            const notificationData = {
              title: "Bravo!!",
              description: `La réclamation que vous avez traitée est approuvée par l'enseignant ${teacher?.fullname}.`,
              assignedTo: claim?.assignedTo,
              targetScreen: "CLAIM_DETAIL",
              data: claim,
            };
            await Notification.create(notificationData);

            await admin.messaging().sendMulticast({
              data: { routeName: "CLAIM_DETAIL" },
              tokens: technicien?.fcm_key,
              notification: {
                title: "Bravo!!",
                body: `La réclamation que vous avez traitée est approuvée par l'enseignant ${teacher?.fullname}.`,
              },
            });
          } else if (
            claim?.claimType === "hardware" &&
            claim?.state === "En panne"
          ) {
            await Computer.findByIdAndUpdate(claim?.computer, {
              isWorking: true,
            });
            await admin.messaging().sendMulticast({
              data: { routeName: "CLAIM_DETAIL" },
              tokens: technicien?.fcm_key,
              notification: {
                title: "Bravo!!",
                body: `La réclamation que vous avez traitée est approuvée par l'enseignant ${teacher?.fullname}.`,
              },
            });
            const notificationData = {
              title: "Bravo!!",
              description: `La réclamation que vous avez traitée est approuvée par l'enseignant ${teacher?.fullname}.`,
              assignedTo: claim?.assignedTo,
              targetScreen: "CLAIM_DETAIL",
              data: claim,
            };
            await Notification.create(notificationData);
          } else if (
            claim?.claimType === "software" &&
            claim?.state === "En marche" &&
            claim?.type === "updateSoftware"
          ) {
            await admin.messaging().sendMulticast({
              data: { routeName: "CLAIM_DETAIL" },
              tokens: technicien?.fcm_key,
              notification: {
                title: "Bravo!!",
                body: `La réclamation que vous avez traitée est approuvée par l'enseignant ${teacher?.fullname}.`,
              },
            });
            const notificationData = {
              title: "Bravo!!",
              description: `La réclamation que vous avez traitée est approuvée par l'enseignant ${teacher?.fullname}.`,
              assignedTo: claim?.assignedTo,
              targetScreen: "CLAIM_DETAIL",
              data: claim,
            };
            await Notification.create(notificationData);
          } else if (
            claim?.isApproved === false &&
            claim?.isConfirmed === true
          ) {
            await admin.messaging().sendMulticast({
              data: { routeName: "CLAIM_DETAIL" },
              tokens: technicien?.fcm_key,
              notification: {
                title: "Bravo!!",
                body: `La réclamation que vous avez traitée n'est pas approuvée par l'enseignant ${teacher?.fullname}.`,
              },
            });
            const notificationData = {
              title: "Bravo!!",
              description: `La réclamation que vous avez traitée n'est pas approuvée par l'enseignant. ${teacher?.fullname}.`,
              assignedTo: claim?.assignedTo,
              targetScreen: "CLAIM_DETAIL",
              data: claim,
            };
            await Notification.create(notificationData);
          }
        }
        return await res.send(claim);
      } catch (error) {
        console.log("error: ", error);
        return next(
          new ErrorResponse(
            "Une erreur s'est produite pendant l'exécution de l'opération de mise a jour de la réclamation " +
              req.params.claimId,
            500
          )
        );
      }
    })
    .catch((err) => {
      console.log("err1: ", err);
      return next(err);
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
