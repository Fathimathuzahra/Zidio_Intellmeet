const prisma = require('../config/prisma');
const { canAccessMeeting } = require('../utils/meetingAccess');
const MAX_TRANSCRIPT_LENGTH = 12000;
async function getMeeting(id, res, userId) {
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) { res.status(404).json({ message: 'Meeting not found' }); return null; }
  if (!(await canAccessMeeting(meeting, userId))) { res.status(403).json({ message: 'You cannot analyze this meeting' }); return null; }
  return meeting;
}
async function simulateAnalysis(req, res) {
  try {
    const meeting = await getMeeting(req.params.id, res, req.user.id);
    if (!meeting) return;
    const transcript = String(req.body?.transcript || meeting.transcript || '').trim().slice(0, MAX_TRANSCRIPT_LENGTH);
    if (!transcript) return res.status(400).json({ message: 'A transcript or meeting notes are required for AI analysis.' });
    const actionItems = [];
    const keywords = ['i will', 'we need to', 'the task is', 'action item:', 'next step:', 'assign to'];
    const sentences = transcript.split(/\r?\n|(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    const summary = `Transcript-based demo analysis for "${meeting.title}": ${sentences.slice(0, 5).join(' ').slice(0, 1000)}`;
    for (const sentence of sentences) {
      if (keywords.some((keyword) => sentence.toLowerCase().includes(keyword))) {
        const assigneeMatch = sentence.match(/\b(?:for|to|assign(?:ed)? to)\s+([A-Z][A-Za-z'-]+)\b/i)
          || sentence.match(/^(?:action item:\s*)?([A-Z][A-Za-z'-]+)\s+(?:will|can|should|must)\b/i);
        if (!actionItems.some((item) => item.text === sentence)) actionItems.push({ text: sentence, assignee: assigneeMatch?.[1] || '' });
      }
    }
    res.json({ summary, actionItems: actionItems.slice(0, 20), source: 'demo' });
  } catch (error) { console.error('AI simulation failed:', error.message); res.status(500).json({ message: 'AI simulation failed.' }); }
}
const analyzeMeeting = async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return simulateAnalysis(req, res);
  try {
    const meeting = await getMeeting(req.params.id, res, req.user.id);
    if (!meeting) return;
    const transcript = String(req.body?.transcript || meeting.transcript || '').trim().slice(0, MAX_TRANSCRIPT_LENGTH);
    if (!transcript) return res.status(400).json({ message: 'A transcript or meeting notes are required for AI analysis.' });
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.2, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: 'You are an enterprise meeting analyst. Return valid JSON only: {"summary":"concise executive summary","actionItems":[{"text":"action","assignee":"name or empty string"}]}. Extract only explicit commitments and decisions.' },
        { role: 'user', content: `Meeting title: ${meeting.title}\n\nTranscript/notes:\n${transcript}` },
      ] }),
    });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(`OpenAI ${response.status}: ${body?.error?.message || response.statusText}`); }
    const completion = await response.json();
    const analysis = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
    const actionItems = Array.isArray(analysis.actionItems) ? analysis.actionItems.slice(0, 20).map((item) => ({ text: String(item.text || '').trim(), assignee: String(item.assignee || '').trim() })).filter((item) => item.text) : [];
    res.json({ summary: String(analysis.summary || '').trim(), actionItems, source: 'openai' });
  } catch (error) { console.error('OpenAI analysis failed:', error.message); res.status(502).json({ message: 'AI analysis is temporarily unavailable. Please try again later.' }); }
};
module.exports = { analyzeMeeting };
