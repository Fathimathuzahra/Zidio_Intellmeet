const crypto = require("crypto");
const Team = require("../models/Team");
const TeamInvitation = require("../models/TeamInvitation");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { getRedisClient } = require("../config/redis");
const { canAccessTeam, canManageTeam } = require("../utils/teamAccess");

// Safe wrapper — no-ops when Redis is not configured
const cache = {
  get: async (key) => { const c = getRedisClient(); return c ? c.get(key) : null; },
  set: async (key, val, opts) => { const c = getRedisClient(); if (c) return c.set(key, val, opts); },
  del: async (key) => { const c = getRedisClient(); if (c) return c.del(key); },
};


const getMyTeam = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const cacheKey = `teams:${userId}`;

    const cachedTeams = await cache.get(cacheKey);
    if (cachedTeams) {
      return res.status(200).json(JSON.parse(cachedTeams));
    }

    const teams = await Team.find({
      $or: [
        { owner: userId },
        { "members.user": userId }
      ]
    })
    .populate("owner", "name email")
    .populate("members.user", "name email");

    await cache.set(cacheKey, JSON.stringify(teams), { EX: 3600 });
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teams", error: error.message });
  }
};

const getTeamById = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const cacheKey = `team:${teamId}`;

    const cachedTeam = await cache.get(cacheKey);
    if (cachedTeam) {
      const team = JSON.parse(cachedTeam);
      if (!canAccessTeam(team, req.user)) {
        return res.status(403).json({ message: "Access denied" });
      }
      return res.status(200).json(team);
    }

    const team = await Team.findById(teamId)
      .populate("owner", "name email")
      .populate("members.user", "name email avatarUrl");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!canAccessTeam(team, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await cache.set(cacheKey, JSON.stringify(team), { EX: 3600 });
    res.status(200).json(team);
  } catch (error) {
    next(error);
  }
};


const createTeam = async (req, res, next) => {
  try {
    const { name } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const team = await Team.create({
      name,
      owner: req.user.id,
      members: [{ user: req.user.id, role: "admin" }],
    });

    // Invalidate cache for the user who created the team
    const cacheKey = `teams:${req.user.id}`;
    await cache.del(cacheKey);

    return res.status(201).json({ team });
  } catch (error) {
    return next(error);
  }
};

const inviteToTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const rawEmail = req.body?.email;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json({ message: "Invite email is required" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!canManageTeam(team, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existingUser = await User.findOne({ email });
    const isAlreadyMember = existingUser
      ? team.members.some(member => member.user.toString() === existingUser._id.toString())
      : false;

    if (existingUser && team.owner.toString() === existingUser._id.toString()) {
      return res.status(400).json({ message: "User is already the team owner" });
    }

    if (isAlreadyMember) {
      return res.status(400).json({ message: "User is already a member of this team" });
    }

    const existingInvitation = await TeamInvitation.findOne({ team: teamId, email });
    if (existingInvitation && existingInvitation.expiresAt > new Date()) {
      return res.status(400).json({ message: "An active invitation already exists for this email" });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await TeamInvitation.create({
      team: team._id,
      email,
      token,
      invitedBy: req.user.id,
      expiresAt,
    });

    const invitationLink = `${process.env.FRONTEND_URL}/teams/invitations/${token}/accept`;
    
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>You have been invited!</h2>
        <p>You have been invited to join the team <strong>${team.name}</strong> on IntellMeet.</p>
        <p>Click the link below to accept the invitation. This link will expire in 7 days.</p>
        <a href="${invitationLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          Accept Invitation
        </a>
      </div>
    `;

    try {
      await sendEmail({
        email: invitation.email,
        subject: `Invitation to join the team ${team.name}`,
        html: emailHtml,
      });
    } catch (mailError) {
      await TeamInvitation.findByIdAndDelete(invitation._id);
      return res.status(500).json({ message: "Failed to send invitation email", error: mailError.message });
    }

    return res.status(201).json({
      message: "Invitation sent and email delivered successfully",
      invitation: {
        id: invitation._id,
        teamId: team._id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getTeamMembers = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId).populate("members.user", "name email avatarUrl");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!canAccessTeam(team, req.user)) {
      return res.status(403).json({ message: "Not authorized to see these members" });
    }

    res.status(200).json(team.members);
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req, res, next) => {
  
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    
    const invitation = await TeamInvitation.findOne({ token });
    
    if (!invitation) {
      return res.status(400).json({ message: "Invalid invitation - No matching invitation found" });
    }
    
    
    if (invitation.status !== "pending") {
      return res.status(400).json({ message: `Invalid invitation - Status is ${invitation.status}` });
    }
    
    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ message: "Invitation expired" });
    }
    
    const team = await Team.findById(invitation.team);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const invitedUser = await User.findById(req.user.id).select("email");
    if (!invitedUser || invitedUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({ message: "This invitation was issued for a different account" });
    }
    
    const alreadyMember = team.members.some(
      (member) => member.user.toString() === req.user.id
    );
    
    if (!alreadyMember) {
      team.members.push({ user: req.user.id, role: "member" });
      await team.save();
    } else {
    }
    
    invitation.status = "accepted";
    invitation.acceptedBy = req.user.id;
    await invitation.save();
    
    // Invalidate caches
    await cache.del(`teams:${req.user.id}`);
    await cache.del(`team:${invitation.team}`);
    
    return res.json({ team, message: "Successfully joined the team" });
    
  } catch (error) {
    console.error("❌ Error in acceptInvitation:", error);
    return next(error);
  }
};

const getJoinedTeams = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const joinedTeams = await Team.find({
      $or: [
        { "members.user": userId },
        { owner: userId }
      ]
    })
    .populate("owner", "name email")
    .populate("members.user", "name email");

    return res.status(200).json(joinedTeams);
  } catch (error) {
    return res.status(500).json({ 
      message: "Error fetching joined teams", 
      error: error.message 
    });
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const isOwner = team.owner.toString() === req.user.id;
    if (!isOwner) return res.status(403).json({ message: "Only the team owner can remove members" });

    if (userId === req.user.id) return res.status(400).json({ message: "Cannot remove yourself" });

    team.members = team.members.filter(m => m.user.toString() !== userId);
    await team.save();

    await cache.del(`teams:${req.user.id}`);
    await cache.del(`team:${teamId}`);

    return res.json({ message: "Member removed successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTeam,
  inviteToTeam,
  acceptInvitation,
  getMyTeam,
  getTeamById,
  getTeamMembers,
  getJoinedTeams,
  removeMember,
};
