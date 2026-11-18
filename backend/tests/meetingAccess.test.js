const assert = require('node:assert/strict');
const test = require('node:test');
const Team = require('../models/Team');
const { canAccessMeeting } = require('../utils/meetingAccess');

test('meeting access is granted to its host and participants', async () => {
  const meeting = {
    host: 'host-1',
    participants: [{ userId: 'member-1' }],
    team: 'team-1',
  };
  const originalFindById = Team.findById;
  Team.findById = () => {
    throw new Error('Team lookup should not be needed for hosts or participants');
  };

  try {
    assert.equal(await canAccessMeeting(meeting, 'host-1'), true);
    assert.equal(await canAccessMeeting(meeting, 'member-1'), true);
  } finally {
    Team.findById = originalFindById;
  }
});

test('meeting access is granted to current team members only', async () => {
  const originalFindById = Team.findById;
  Team.findById = () => ({
    select: async () => ({
      owner: 'team-owner',
      members: [{ user: 'team-member' }],
    }),
  });

  try {
    const meeting = { host: 'host-1', participants: [], team: 'team-1' };
    assert.equal(await canAccessMeeting(meeting, 'team-owner'), true);
    assert.equal(await canAccessMeeting(meeting, 'team-member'), true);
    assert.equal(await canAccessMeeting(meeting, 'outsider'), false);
  } finally {
    Team.findById = originalFindById;
  }
});
