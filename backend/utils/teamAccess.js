function hasSameId(value, userId) {
  return value != null && String(value) === String(userId);
}

function getMembership(team, userId) {
  return team?.members?.find((member) => hasSameId(member.user?._id || member.user, userId));
}

function canAccessTeam(team, user) {
  if (!team || !user?.id) return false;
  return user.role === "admin" || hasSameId(team.owner?._id || team.owner, user.id) || Boolean(getMembership(team, user.id));
}

function canManageTeam(team, user) {
  if (!team || !user?.id) return false;
  const membership = getMembership(team, user.id);
  return user.role === "admin" || hasSameId(team.owner?._id || team.owner, user.id) || membership?.role === "admin";
}

module.exports = { canAccessTeam, canManageTeam, getMembership };
