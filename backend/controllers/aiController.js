const Meeting = require('../models/Meeting');
const { canAccessMeeting } = require('../utils/meetingAccess');

const MAX_TRANSCRIPT_LENGTH = 12000;

async function simulateAnalysis(req, res) {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!(await canAccessMeeting(meeting, req.user.id))) return res.status(403).json({ message: 'You cannot analyze this meeting' });

    const transcript = String(req.body?.transcript || meeting.transcript || '').trim().slice(0, MAX_TRANSCRIPT_LENGTH);
    if (!transcript) return res.status(400).json({ message: 'A transcript or meeting notes are required for AI analysis.' });

    const actionItems = [];
    const actionKeywords = ['i will', 'we need to', 'the task is', 'action item:', 'next step:', 'assign to'];
    const sentences = transcript
      .split(/\r?\n|(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const summary = `Transcript-based demo analysis for "${meeting.title}": ${sentences.slice(0, 5).join(' ').slice(0, 1000)}`;
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (actionKeywords.some((kw) => lower.includes(kw))) {
        const text = sentence.trim();
        const assigneeMatch = text.match(/\b(?:for|to|assign(?:ed)? to)\s+([A-Z][A-Za-z'-]+)\b/i)
          || text.match(/^(?:action item:\s*)?([A-Z][A-Za-z'-]+)\s+(?:will|can|should|must)\b/i);
        const assignee = assigneeMatch?.[1] || '';
        if (text && !actionItems.some((item) => item.text === text)) actionItems.push({ text, assignee });
      }
    }
    res.json({ summary, actionItems: actionItems.slice(0, 20), source: 'demo' });
  } catch (error) {
    console.error('AI simulation failed:', error.message);
    res.status(500).json({ message: 'AI simulation failed.' });
  }
}

const analyzeMeeting = async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return simulateAnalysis(req, res);

  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!(await canAccessMeeting(meeting, req.user.id))) return res.status(403).json({ message: 'You cannot analyze this meeting' });

    const transcript = String(req.body?.transcript || meeting.transcript || '').trim().slice(0, MAX_TRANSCRIPT_LENGTH);
    if (!transcript) return res.status(400).json({ message: 'A transcript or meeting notes are required for AI analysis.' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an enterprise meeting analyst. Return valid JSON only: {"summary":"concise executive summary","actionItems":[{"text":"action","assignee":"name or empty string"}]}. Extract only explicit commitments and decisions.' },
          { role: 'user', content: `Meeting title: ${meeting.title}\n\nTranscript/notes:\n${transcript}` },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(`OpenAI ${response.status}: ${errBody?.error?.message || response.statusText}`);
    }

    const completion = await response.json();
    const analysis = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
    const actionItems = Array.isArray(analysis.actionItems)
      ? analysis.actionItems.slice(0, 20).map((item) => ({ text: String(item.text || '').trim(), assignee: String(item.assignee || '').trim() })).filter((item) => item.text)
      : [];
    res.json({ summary: String(analysis.summary || '').trim(), actionItems, source: 'openai' });
  } catch (error) {
    console.error('OpenAI analysis failed:', error.message);
    return res.status(502).json({ message: 'AI analysis is temporarily unavailable. Please try again later.' });
  }
};

module.exports = { analyzeMeeting };
