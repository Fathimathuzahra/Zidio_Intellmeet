const assert = require('node:assert/strict');
const test = require('node:test');
const prisma = require('../config/prisma');
const { getMeeting, saveSummary, toggleActionItem } = require('../controllers/meetingController');
function createResponse() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
test('meeting records and updates are denied to users outside the meeting', async () => {
  const originalFindUnique = prisma.meeting.findUnique;
  const meeting = { id: 'meeting-1', hostId: 'host-1', participants: [{ userId: 'member-1' }], teamId: null, summary: 'Existing summary' };
  prisma.meeting.findUnique = async () => meeting;
  try {
    const getResponse = createResponse();
    await getMeeting({ params: { id: 'meeting-1' }, user: { id: 'outsider' } }, getResponse);
    assert.equal(getResponse.statusCode, 403);
    assert.equal(getResponse.body.message, 'You cannot access this meeting');
    const summaryResponse = createResponse();
    await saveSummary({ params: { id: 'meeting-1' }, body: { summary: 'Unauthorized replacement', actionItems: [] }, user: { id: 'outsider' } }, summaryResponse);
    assert.equal(summaryResponse.statusCode, 403);
    assert.equal(meeting.summary, 'Existing summary');
    const actionResponse = createResponse();
    await toggleActionItem({ params: { id: 'meeting-1', itemId: 'action-1' }, user: { id: 'outsider' } }, actionResponse);
    assert.equal(actionResponse.statusCode, 403);
  } finally { prisma.meeting.findUnique = originalFindUnique; }
});
