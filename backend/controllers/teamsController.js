const crypto = require('crypto');
const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendEmail');
const { getRedisClient } = require('../config/redis');
const { canAccessTeam, canManageTeam } = require('../utils/teamAccess');
const cache = {
  get: async (key) => { const client = getRedisClient(); return client ? client.get(key) : null; },
  set: async (key, value, options) => { const client = getRedisClient(); if (client) return client.set(key, value, options); },
  del: async (key) => { const client = getRedisClient(); if (client) return client.del(key); },
};
const teamInclude = { owner: { select: { id: true, name: true, email: true } }, members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } } };
function teamApi(team, populated = true) {
  if (!team) return team;
  return { _id: team.id, name: team.name,
    owner: populated && team.owner ? { _id: team.owner.id, name: team.owner.name, email: team.owner.email } : team.ownerId,
    members: (team.members || []).map((member) => ({
      user: populated && member.user ? { _id: member.user.id, name: member.user.name, email: member.user.email, ...(member.user.avatarUrl ? { avatarUrl: member.user.avatarUrl } : {}) } : member.userId,
      role: member.role,
    })), createdAt: team.createdAt, updatedAt: team.updatedAt };
}
async function getMyTeam(req, res) {
  try {
    const userId = req.user.id;
    const key = `teams:${userId}`;
    const cached = await cache.get(key);
    if (cached) return res.status(200).json(JSON.parse(cached));
    const teams = await prisma.team.findMany({ where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] }, include: teamInclude });
    const output = teams.map((team) => teamApi(team));
    await cache.set(key, JSON.stringify(output), { EX: 3600 });
    res.status(200).json(output);
  } catch (error) { res.status(500).json({ message: 'Error fetching teams', error: error.message }); }
}
async function getTeamById(req, res, next) {
  try {
    const { teamId } = req.params;
    const cached = await cache.get(`team:${teamId}`);
    if (cached) {
      const team = JSON.parse(cached);
      if (!canAccessTeam(team, req.user)) return res.status(403).json({ message: 'Access denied' });
      return res.status(200).json(team);
    }
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: teamInclude });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (!canAccessTeam(team, req.user)) return res.status(403).json({ message: 'Access denied' });
    const output = teamApi(team);
    await cache.set(`team:${teamId}`, JSON.stringify(output), { EX: 3600 });
    res.status(200).json(output);
  } catch (error) { next(error); }
}
async function createTeam(req, res, next) {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ message: 'Team name is required' });
    const team = await prisma.team.create({ data: { name, ownerId: req.user.id, members: { create: { userId: req.user.id, role: 'admin' } } }, include: { members: true } });
    await cache.del(`teams:${req.user.id}`);
    res.status(201).json({ team: teamApi(team, false) });
  } catch (error) { next(error); }
}
async function inviteToTeam(req, res, next) {
  try {
    const { teamId } = req.params;
    const rawEmail = req.body?.email;
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    if (!email) return res.status(400).json({ message: 'Invite email is required' });
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (!canManageTeam(team, req.user)) return res.status(403).json({ message: 'Forbidden' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && team.ownerId === user.id) return res.status(400).json({ message: 'User is already the team owner' });
    if (user && team.members.some((m) => m.userId === user.id)) return res.status(400).json({ message: 'User is already a member of this team' });
    const existing = await prisma.teamInvitation.findFirst({ where: { teamId, email, status: 'pending', expiresAt: { gt: new Date() } } });
    if (existing) return res.status(400).json({ message: 'An active invitation already exists for this email' });
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await prisma.teamInvitation.create({ data: { teamId, email, token, invitedById: req.user.id, expiresAt } });
    const link = `${process.env.FRONTEND_URL}/teams/invitations/${token}/accept`;
    try {
      await sendEmail({ email, subject: `Invitation to join the team ${team.name}`, html: `<div style="font-family:sans-serif;padding:20px;color:#333"><h2>You have been invited!</h2><p>You have been invited to join <strong>${team.name}</strong> on IntellMeet.</p><p>This link expires in 7 days.</p><a href="${link}" style="background:#4F46E5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px">Accept Invitation</a></div>` });
    } catch (mailError) {
      await prisma.teamInvitation.delete({ where: { id: invitation.id } });
      return res.status(500).json({ message: 'Failed to send invitation email', error: mailError.message });
    }
    res.status(201).json({ message: 'Invitation sent and email delivered successfully', invitation: { id: invitation.id, teamId, email, expiresAt } });
  } catch (error) { next(error); }
}
async function getTeamMembers(req, res, next) {
  try {
    const { teamId } = req.params;
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: teamInclude });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (!canAccessTeam(team, req.user)) return res.status(403).json({ message: 'Not authorized to see these members' });
    res.status(200).json(teamApi(team).members);
  } catch (error) { next(error); }
}
async function acceptInvitation(req, res, next) {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ message: 'Token is required' });
    const invitation = await prisma.teamInvitation.findUnique({ where: { token } });
    if (!invitation) return res.status(400).json({ message: 'Invalid invitation - No matching invitation found' });
    if (invitation.status !== 'pending') return res.status(400).json({ message: `Invalid invitation - Status is ${invitation.status}` });
    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({ where: { id: invitation.id }, data: { status: 'expired' } });
      return res.status(400).json({ message: 'Invitation expired' });
    }
    const team = await prisma.team.findUnique({ where: { id: invitation.teamId }, include: { members: true } });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true } });
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) return res.status(403).json({ message: 'This invitation was issued for a different account' });
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.upsert({ where: { teamId_userId: { teamId: team.id, userId: user.id } }, create: { teamId: team.id, userId: user.id, role: 'member' }, update: {} });
      await tx.teamInvitation.update({ where: { id: invitation.id }, data: { status: 'accepted', acceptedById: user.id } });
    });
    await cache.del(`teams:${user.id}`);
    await cache.del(`team:${team.id}`);
    const populated = await prisma.team.findUnique({ where: { id: team.id }, include: teamInclude });
    res.json({ team: teamApi(populated, false), message: 'Successfully joined the team' });
  } catch (error) { console.error('Error in acceptInvitation:', error); next(error); }
}
async function getJoinedTeams(req, res, next) {
  try {
    const userId = req.user.id;
    const teams = await prisma.team.findMany({ where: { OR: [{ members: { some: { userId } } }, { ownerId: userId }] }, include: teamInclude });
    res.status(200).json(teams.map((team) => teamApi(team)));
  } catch (error) { res.status(500).json({ message: 'Error fetching joined teams', error: error.message }); }
}
async function removeMember(req, res, next) {
  try {
    const { teamId, userId } = req.params;
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.ownerId !== req.user.id) return res.status(403).json({ message: 'Only the team owner can remove members' });
    if (userId === req.user.id) return res.status(400).json({ message: 'Cannot remove yourself' });
    await prisma.teamMember.deleteMany({ where: { teamId, userId } });
    await cache.del(`teams:${req.user.id}`);
    await cache.del(`team:${teamId}`);
    res.json({ message: 'Member removed successfully' });
  } catch (error) { next(error); }
}
module.exports = { createTeam, inviteToTeam, acceptInvitation, getMyTeam, getTeamById, getTeamMembers, getJoinedTeams, removeMember };
