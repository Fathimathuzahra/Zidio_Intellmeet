const assert = require('node:assert/strict');
const test = require('node:test');
const prisma = require('../config/prisma');
const { analyzeMeeting } = require('../controllers/aiController');

test('configured AI provider failures are returned instead of simulated success', async () => {
  const originalFindUnique = prisma.meeting.findUnique;
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;
  let statusCode;
  let responseBody;
  prisma.meeting.findUnique = async () => ({ id: 'meeting-1', hostId: 'user-1', participants: [], teamId: null, title: 'Planning' });
  process.env.OPENAI_API_KEY = 'test-key';
  global.fetch = async () => ({ ok: false, status: 503, statusText: 'Service Unavailable', json: async () => ({ error: { message: 'provider unavailable' } }) });
  const response = { status(code) { statusCode = code; return this; }, json(body) { responseBody = body; return this; } };

  try {
    await analyzeMeeting({ params: { id: 'meeting-1' }, body: { transcript: 'We will review the launch plan.' }, user: { id: 'user-1' } }, response);
    assert.equal(statusCode, 502);
    assert.deepEqual(responseBody, { message: 'AI analysis is temporarily unavailable. Please try again later.' });
  } finally {
    prisma.meeting.findUnique = originalFindUnique;
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  }
});

test('demo analysis summarizes supplied notes and extracts explicit action items', async () => {
  const originalFindUnique = prisma.meeting.findUnique;
  const originalApiKey = process.env.OPENAI_API_KEY;
  let responseBody;
  prisma.meeting.findUnique = async () => ({ id: 'meeting-1', hostId: 'user-1', participants: [], teamId: null, title: 'Planning' });
  delete process.env.OPENAI_API_KEY;
  const response = { status() { return this; }, json(body) { responseBody = body; return this; } };

  try {
    await analyzeMeeting({ params: { id: 'meeting-1' }, body: { transcript: 'Meeting note: Launch is scheduled for Friday.\nAction item: Maya will send the release checklist.' }, user: { id: 'user-1' } }, response);
    assert.match(responseBody.summary, /Launch is scheduled for Friday/);
    assert.deepEqual(responseBody.actionItems, [{ text: 'Action item: Maya will send the release checklist.', assignee: 'Maya' }]);
    assert.equal(responseBody.source, 'demo');
  } finally {
    prisma.meeting.findUnique = originalFindUnique;
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  }
});
