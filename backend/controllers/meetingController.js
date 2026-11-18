const Meeting = require('../models/Meeting');
const Team = require('../models/Team');
const sendMeetingEmail = require('../utils/sendMeetingEmail');
const { canAccessMeeting } = require('../utils/meetingAccess');

function generateRoomId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function notifyTeamMembers(meeting, team, host, isScheduled) {
  const User = require('../models/User');
  const memberIds = team.members.map(member => member.user);
  const members = await User.find({ _id: { $in: memberIds } });

  await Promise.all(members.map(member =>
    sendMeetingEmail({
      to: member.email,
      userName: member.name,
      meetingTitle: meeting.title,
      meetingTime: meeting.scheduledAt || meeting.createdAt,
      roomId: meeting.roomId,
      hostName: host.name,
      isScheduled,
    })
  ));
}

const getMeetings = async (req, res) => {
  try {
    const userId = req.user.id;

    const userTeams = await Team.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');
    const teamIds = userTeams.map(t => t._id);

    const meetings = await Meeting.find({
      $or: [
        { host: userId },
        { 'participants.userId': userId },
        { team: { $in: teamIds } },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('host', 'name email')
      .populate('participants.userId', 'name email')
      .populate('team', 'name');

    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!(await canAccessMeeting(meeting, req.user.id))) {
      return res.status(403).json({ message: 'You cannot access this meeting' });
    }

    await meeting.populate('host', 'name email');
    await meeting.populate('participants.userId', 'name email');
    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createMeeting = async (req, res) => {
  try {
    const { title, scheduledAt, teamId } = req.body;

    let team = null;
    if (teamId) {
      team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });

      const isMember = team.members.some(m => m.user.toString() === req.user.id);
      if (!isMember && team.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You are not a member of this team' });
      }
    }

    const meeting = new Meeting({
      title,
      roomId: generateRoomId(),
      host: req.user.id,
      team: teamId || null,
      scheduledAt: scheduledAt || null,
      status: scheduledAt && new Date(scheduledAt) > new Date() ? 'scheduled' : 'active',
      participants: [{ userId: req.user.id, joinedAt: new Date() }],
    });

    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('host', 'name email')
      .populate('team');

    if (team && team.members.length > 0) {
      // Invitation delivery must never make a successfully-created meeting fail.
      // SMTP is optional for local demos and can be retried independently.
      notifyTeamMembers(populatedMeeting, team, populatedMeeting.host, meeting.status === 'scheduled')
        .catch((notificationError) => console.warn('Meeting invitation delivery failed:', notificationError.message));
    }

    res.status(201).json(populatedMeeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const startMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name email')
      .populate('team');

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.host._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the host can start the meeting' });
    }

    meeting.status = 'active';
    meeting.startedAt = new Date();
    await meeting.save();

    if (meeting.team && meeting.team.members) {
      notifyTeamMembers(meeting, meeting.team, meeting.host, false)
        .catch((notificationError) => console.warn('Meeting start notification failed:', notificationError.message));
    }

    res.json({ meeting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const endMeeting = async (req, res) => {
  try {
    const { transcript } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the meeting host can end this meeting' });
    }

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    if (transcript) meeting.transcript = transcript;

    await meeting.save();
    res.json({ meeting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const saveSummary = async (req, res) => {
  try {
    const { summary, actionItems } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!(await canAccessMeeting(meeting, req.user.id))) {
      return res.status(403).json({ message: 'You cannot update this meeting' });
    }

    meeting.summary = summary;
    if (Array.isArray(actionItems)) {
      const statusMap = {
        'todo': 'todo',
        'in-progress': 'in_progress',
        'done': 'done'
      };
      meeting.actionItems = actionItems.map(item => ({
        text: item.text,
        assignee: item.assignee || '',
        completed: item.completed || false, // Preserve completed status if present
        status: statusMap[item.status?.toLowerCase()] || 'todo', // Map status
      }));
    }
    await meeting.save();
    res.json({ meeting });
  } catch (error) {
    console.error('Error saving meeting summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleActionItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!(await canAccessMeeting(meeting, req.user.id))) {
      return res.status(403).json({ message: 'You cannot update this meeting' });
    }

    const item = meeting.actionItems.id(itemId);
    if (!item) return res.status(404).json({ message: 'Action item not found' });

    item.completed = !item.completed;
    item.status = item.completed ? 'done' : 'todo';
    await meeting.save();
    res.json({ meeting });
  } catch (error) {
    console.error('Error updating meeting action item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const userTeams = await Team.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');
    const teamIds = userTeams.map(t => t._id);

    const meetings = await Meeting.find({
      $or: [
        { host: userId },
        { 'participants.userId': userId },
        { team: { $in: teamIds } },
      ],
    });

    const total = meetings.length;
    const ended = meetings.filter(m => m.status === 'ended').length;
    const active = meetings.filter(m => m.status === 'active').length;
    const scheduled = meetings.filter(m => m.status === 'scheduled').length;
    const aiGeneratedSummaries = meetings.filter(m => m.summary).length;

    const allActionItems = meetings.flatMap(m => m.actionItems);
    const totalActionItems = allActionItems.length;
    const completedActionItems = allActionItems.filter(i => i.completed).length;

    const endedWithDuration = meetings.filter(m => m.startedAt && m.endedAt);
    const averageDurationMinutes = endedWithDuration.length
      ? Math.round(
          endedWithDuration.reduce(
            (sum, m) => sum + (new Date(m.endedAt) - new Date(m.startedAt)) / 60000,
            0,
          ) / endedWithDuration.length,
        )
      : 0;

    const recentMeetings = meetings
      .filter(m => m.status === 'ended')
      .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
      .slice(0, 10);

    res.json({
      total,
      ended,
      active,
      scheduled,
      totalActionItems,
      completedActionItems,
      averageDurationMinutes,
      aiGeneratedSummaries,
      recentMeetings,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the host can delete this meeting' });
    }
    await meeting.deleteOne();
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMeetings,
  getMeeting,
  createMeeting,
  startMeeting,
  endMeeting,
  saveSummary,
  toggleActionItem,
  getAnalytics,
  deleteMeeting,
};
