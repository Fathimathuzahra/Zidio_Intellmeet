const assert = require('node:assert/strict');
const test = require('node:test');
const prisma = require('../config/prisma');
const { canAccessMeeting } = require('../utils/meetingAccess');

test('meeting access is granted to its host and participants', async () => {
  const originalFindFirst = prisma.team.findFirst;
  prisma.team.findFirst = async () => { throw new Error('Team lookup should not be needed for hosts or participants'); };
  try {
    const meeting = { hostId: 'host-1', participants: [{ userId: 'member-1' }], teamId: 'team-1' };
    assert.equal(await canAccessMeeting(meeting, 'host-1'), true);
    assert.equal(await canAccessMeeting(meeting, 'member-1'), true);
  } finally { prisma.team.findFirst = originalFindFirst; }
});

test('meeting access is granted to current team members only', async () => {
  const originalFindFirst = prisma.team.findFirst;
  prisma.team.findFirst = async ({ where }) => where.OR.some((condition) => condition.ownerId === 'team-owner' || condition.members?.some?.userId === 'team-member')
    ? { id: where.id } : null;
  try {
    const meeting = { hostId: 'host-1', participants: [], teamId: 'team-1' };
    assert.equal(await canAccessMeeting(meeting, 'team-owner'), true);
    assert.equal(await canAccessMeeting(meeting, 'team-member'), true);
    assert.equal(await canAccessMeeting(meeting, 'outsider'), false);
  } finally { prisma.team.findFirst = originalFindFirst; }
});
