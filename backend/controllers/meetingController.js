const prisma = require('../config/prisma');
const sendMeetingEmail = require('../utils/sendMeetingEmail');
const { canAccessMeeting } = require('../utils/meetingAccess');

const meetingIncludes = { host: { select: { id: true, name: true, email: true } }, team: { select: { id: true, name: true } }, participants: { include: { user: { select: { id: true, name: true, email: true } } } }, actionItems: true };
const toUser = (user) => user ? { _id: user.id, name: user.name, email: user.email } : user;
function meetingApi(meeting) {
  if (!meeting) return meeting;
  return {
    _id: meeting.id, roomId: meeting.roomId, title: meeting.title,
    host: meeting.host ? toUser(meeting.host) : meeting.hostId,
    team: meeting.team ? { _id: meeting.team.id, name: meeting.team.name } : meeting.teamId,
    scheduledAt: meeting.scheduledAt, status: meeting.status,
    participants: (meeting.participants || []).map((p) => ({
      _id: p.id, userId: p.user ? toUser(p.user) : p.userId, joinedAt: p.joinedAt, leftAt: p.leftAt,
    })),
    actionItems: (meeting.actionItems || []).map((item) => ({
      _id: item.id, text: item.text, assignee: item.assignee, completed: item.completed,
      status: item.status, priority: item.priority, createdAt: item.createdAt,
    })),
    summary: meeting.summary, transcript: meeting.transcript, startedAt: meeting.startedAt,
    endedAt: meeting.endedAt, createdAt: meeting.createdAt, updatedAt: meeting.updatedAt,
  };
}
function generateRoomId() { return Math.random().toString(36).substring(2, 10).toUpperCase(); }
async function notifyTeamMembers(meeting, team, host, isScheduled) {
  const members = await prisma.user.findMany({ where: { memberships: { some: { teamId: team.id } } }, select: { name: true, email: true } });
  await Promise.all(members.map((member) => sendMeetingEmail({
    to: member.email, userName: member.name, meetingTitle: meeting.title,
    meetingTime: meeting.scheduledAt || meeting.createdAt, roomId: meeting.roomId,
    hostName: host.name, isScheduled,
  })));
}
async function getMeetings(req, res) {
  try {
    const userId = req.user.id;
    const teams = await prisma.team.findMany({ where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] }, select: { id: true } });
    const meetings = await prisma.meeting.findMany({ where: { OR: [
      { hostId: userId }, { participants: { some: { userId } } }, { teamId: { in: teams.map((t) => t.id) } },
    ] }, orderBy: { createdAt: 'desc' }, include: meetingIncludes });
    res.json(meetings.map(meetingApi));
  } catch (error) { console.error('Error fetching meetings:', error); res.status(500).json({ message: 'Server error' }); }
}
async function getMeeting(req, res) {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id }, include: meetingIncludes });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!(await canAccessMeeting(meeting, req.user.id))) return res.status(403).json({ message: 'You cannot access this meeting' });
    res.json(meetingApi(meeting));
  } catch (error) { console.error('Error fetching meeting:', error); res.status(500).json({ message: 'Server error' }); }
}
async function createMeeting(req, res) {
  try {
    const { title, scheduledAt, teamId } = req.body;
    let team = null;
    if (teamId) {
      team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
      if (!team) return res.status(404).json({ message: 'Team not found' });
      const isMember = team.members.some((m) => m.userId === req.user.id);
      if (!isMember && team.ownerId !== req.user.id) return res.status(403).json({ message: 'You are not a member of this team' });
    }
    let roomId = generateRoomId();
    while (await prisma.meeting.findUnique({ where: { roomId }, select: { id: true } })) roomId = generateRoomId();
    const created = await prisma.meeting.create({ data: {
      title, roomId, hostId: req.user.id, teamId: teamId || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt && new Date(scheduledAt) > new Date() ? 'scheduled' : 'active',
      participants: { create: { userId: req.user.id } },
    } });
    const populated = await prisma.meeting.findUnique({ where: { id: created.id }, include: meetingIncludes });
    if (team && team.members.length) notifyTeamMembers(populated, team, populated.host, populated.status === 'scheduled')
      .catch((e) => console.warn('Meeting invitation delivery failed:', e.message));
    res.status(201).json(meetingApi(populated));
  } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
}
async function startMeeting(req, res) {
  try {
    const existing = await prisma.meeting.findUnique({ where: { id: req.params.id }, include: { host: true, team: { include: { members: true } } } });
    if (!existing) return res.status(404).json({ message: 'Meeting not found' });
    if (existing.hostId !== req.user.id) return res.status(403).json({ message: 'Only the host can start the meeting' });
    const meeting = await prisma.meeting.update({ where: { id: existing.id }, data: { status: 'active', startedAt: new Date() }, include: meetingIncludes });
    if (existing.team) notifyTeamMembers(meeting, existing.team, meeting.host, false).catch((e) => console.warn('Meeting start notification failed:', e.message));
    res.json({ meeting: meetingApi(meeting) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
}
async function endMeeting(req, res) {
  try {
    const existing = await prisma.meeting.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Meeting not found' });
    if (existing.hostId !== req.user.id) return res.status(403).json({ message: 'Only the meeting host can end this meeting' });
    const data = { status: 'ended', endedAt: new Date() };
    if (req.body?.transcript) data.transcript = req.body.transcript;
    const meeting = await prisma.meeting.update({ where: { id: existing.id }, data, include: meetingIncludes });
    res.json({ meeting: meetingApi(meeting) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
}
async function saveSummary(req, res) {
  try {
    const existing = await prisma.meeting.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Meeting not found' });
    if (!(await canAccessMeeting(existing, req.user.id))) return res.status(403).json({ message: 'You cannot update this meeting' });
    const data = { summary: req.body.summary };
    if (Array.isArray(req.body.actionItems)) {
      const statusMap = { todo: 'todo', 'in-progress': 'in_progress', done: 'done' };
      data.actionItems = { deleteMany: {}, create: req.body.actionItems.map((item) => ({
        text: item.text, assignee: item.assignee || '', completed: Boolean(item.completed), status: statusMap[item.status?.toLowerCase()] || 'todo',
      })) };
    }
    const meeting = await prisma.meeting.update({ where: { id: existing.id }, data, include: meetingIncludes });
    res.json({ meeting: meetingApi(meeting) });
  } catch (error) { console.error('Error saving meeting summary:', error); res.status(500).json({ message: 'Server error' }); }
}
async function toggleActionItem(req, res) {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id }, include: { actionItems: true } });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!(await canAccessMeeting(meeting, req.user.id))) return res.status(403).json({ message: 'You cannot update this meeting' });
    const item = meeting.actionItems.find((action) => action.id === req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Action item not found' });
    await prisma.actionItem.update({ where: { id: item.id }, data: { completed: !item.completed, status: item.completed ? 'todo' : 'done' } });
    const updated = await prisma.meeting.findUnique({ where: { id: meeting.id }, include: meetingIncludes });
    res.json({ meeting: meetingApi(updated) });
  } catch (error) { console.error('Error updating meeting action item:', error); res.status(500).json({ message: 'Server error' }); }
}
async function getAnalytics(req, res) {
  try {
    const userId = req.user.id;
    const teams = await prisma.team.findMany({ where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] }, select: { id: true } });
    const meetings = await prisma.meeting.findMany({ where: { OR: [
      { hostId: userId }, { participants: { some: { userId } } }, { teamId: { in: teams.map((t) => t.id) } },
    ] }, include: { actionItems: true } });
    const total = meetings.length;
    const ended = meetings.filter((m) => m.status === 'ended').length;
    const active = meetings.filter((m) => m.status === 'active').length;
    const scheduled = meetings.filter((m) => m.status === 'scheduled').length;
    const items = meetings.flatMap((m) => m.actionItems);
    const durations = meetings.filter((m) => m.startedAt && m.endedAt);
    const recent = meetings.filter((m) => m.status === 'ended').sort((a, b) => b.endedAt - a.endedAt).slice(0, 10).map(meetingApi);
    res.json({ total, ended, active, scheduled, totalActionItems: items.length,
      completedActionItems: items.filter((i) => i.completed).length,
      averageDurationMinutes: durations.length ? Math.round(durations.reduce((sum, m) => sum + (m.endedAt - m.startedAt) / 60000, 0) / durations.length) : 0,
      aiGeneratedSummaries: meetings.filter((m) => m.summary).length, recentMeetings: recent });
  } catch (error) { console.error('Analytics error:', error); res.status(500).json({ message: 'Server error' }); }
}
async function deleteMeeting(req, res) {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id }, select: { id: true, hostId: true } });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.hostId !== req.user.id) return res.status(403).json({ message: 'Only the host can delete this meeting' });
    await prisma.meeting.delete({ where: { id: meeting.id } });
    res.json({ message: 'Meeting deleted' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
}
module.exports = { getMeetings, getMeeting, createMeeting, startMeeting, endMeeting, saveSummary, toggleActionItem, getAnalytics, deleteMeeting };
