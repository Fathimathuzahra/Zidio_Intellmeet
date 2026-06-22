const crypto = require("crypto");
const Team = require("../models/Team");
const TeamInvitation = require("../models/TeamInvitation");
const sendEmail = require("../utils/sendEmail");


const getMyTeam = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const teams = await Team.find({
      $or: [
        { owner: userId },
        { "members.user": userId }
      ]
    })
    .populate("owner", "name email")
    .populate("members.user", "name email");

    console.log("Searching teams for user:", userId);
    console.log("Teams found:", teams.length);

    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teams", error: error.message });
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

    return res.status(201).json({ team });
  } catch (error) {
    return next(error);
  }
};

const inviteToTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: "Invite email is required" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const isOwner = team.owner.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const isAlreadyMember = team.members.some(member => member.user.toString() === email);
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

    const isMember = team.members.some(m => m.user._id.toString() === req.user.id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to see these members" });
    }

    res.status(200).json(team.members);
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req, res, next) => {
  console.log("=== ACCEPT INVITATION ===");
  console.log("User ID:", req.user?.id);
  console.log("User email:", req.user?.email);
  console.log("Token param:", req.params.token);
  
  try {
    const { token } = req.params;
    
    if (!token) {
      console.log("❌ No token provided");
      return res.status(400).json({ message: "Token is required" });
    }
    
    const invitation = await TeamInvitation.findOne({ token });
    console.log("Invitation found:", invitation ? "YES" : "NO");
    
    if (!invitation) {
      return res.status(400).json({ message: "Invalid invitation - No matching invitation found" });
    }
    
    console.log("Invitation status:", invitation.status);
    console.log("Invitation expiresAt:", invitation.expiresAt);
    console.log("Current time:", new Date());
    
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
    
    const alreadyMember = team.members.some(
      (member) => member.user.toString() === req.user.id
    );
    
    if (!alreadyMember) {
      team.members.push({ user: req.user.id, role: "member" });
      await team.save();
      console.log("✅ User added to team");
    } else {
      console.log("User is already a member");
    }
    
    invitation.status = "accepted";
    invitation.acceptedBy = req.user.id;
    await invitation.save();
    
    console.log("✅ Invitation accepted successfully");
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
      $and: [
        { "members.user": userId },
        { owner: { $ne: userId } }
      ]
    })
    .populate("owner", "name email")
    .populate("members.user", "name email");

    console.log(`Searching joined teams for member: ${userId}`);
    console.log(`Joined teams found: ${joinedTeams.length}`);

    return res.status(200).json(joinedTeams);
  } catch (error) {
    return res.status(500).json({ 
      message: "Error fetching joined teams", 
      error: error.message 
    });
  }
};

module.exports = {
  createTeam,
  inviteToTeam,
  acceptInvitation,
  getMyTeam,
  getTeamMembers,
  getJoinedTeams
};
