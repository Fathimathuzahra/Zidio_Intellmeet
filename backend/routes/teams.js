const express = require("express");
const protect = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const {
  createTeam,
  inviteToTeam,
  acceptInvitation,
  getMyTeam,
  getTeamMembers,
  getJoinedTeams
} = require("../controllers/teamsController");

const router = express.Router();

router.post("/", protect, authorizeRoles("admin"), createTeam);
router.get("/", protect, authorizeRoles("admin"), getMyTeam);
router.get("/joined", protect, authorizeRoles("member"), getJoinedTeams);
router.get("/:teamId/members", protect, getTeamMembers);
router.post("/:teamId/invite", protect, authorizeRoles("admin"), inviteToTeam);
router.post("/invitations/:token/accept", protect, acceptInvitation);

module.exports = router;
