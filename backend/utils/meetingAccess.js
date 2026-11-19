const prisma = require('../config/prisma');
async function canAccessMeeting(meeting, userId) {
  const id = String(userId);
  const hostId = meeting.hostId || meeting.host?._id || meeting.host;
  if (String(hostId) === id) return true;
  if ((meeting.participants || []).some((p) => String(p.userId?._id || p.userId || p.user?.id || p.user?._id) === id)) return true;
  const teamId = meeting.teamId || meeting.team?._id || meeting.team;
  if (!teamId) return false;
  if (typeof meeting.team === 'object' && meeting.team) {
    return String(meeting.team.ownerId || meeting.team.owner?._id || meeting.team.owner) === id
      || (meeting.team.members || []).some((m) => String(m.userId || m.user?._id || m.user) === id);
  }
  const membership = await prisma.team.findFirst({
    where: { id: String(teamId), OR: [{ ownerId: id }, { members: { some: { userId: id } } }] },
    select: { id: true },
  });
  return Boolean(membership);
}
module.exports = { canAccessMeeting };
