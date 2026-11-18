const express = require("express");
const protect = require("../middleware/auth");
const {
  createTeam,
  inviteToTeam,
  acceptInvitation,
  getMyTeam,
  getTeamById,
  getTeamMembers,
  getJoinedTeams,
  removeMember,
} = require("../controllers/teamsController");

const router = express.Router();

router.post("/", protect, createTeam);
router.get("/", protect, getMyTeam);
router.get("/joined", protect, getJoinedTeams);

// This route must be before /:teamId/members
router.get("/:teamId", protect, getTeamById);

router.get("/:teamId/members", protect, getTeamMembers);
router.post("/:teamId/invite", protect, inviteToTeam);
router.delete("/:teamId/members/:userId", protect, removeMember);
router.post("/invitations/:token/accept", protect, acceptInvitation);

module.exports = router;
