const Team = require('../models/Team');

async function canAccessMeeting(meeting, userId) {
  const id = String(userId);
  if (String(meeting.host) === id) return true;
  if (meeting.participants.some((participant) => String(participant.userId) === id)) return true;
  if (!meeting.team) return false;

  const team = await Team.findById(meeting.team).select('owner members');
  return Boolean(
    team &&
    (String(team.owner) === id || team.members.some((member) => String(member.user) === id))
  );
}

module.exports = { canAccessMeeting };
