const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  assignee: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
});

const meetingSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, 
  scheduledAt: { type: Date },
  status: { type: String, enum: ['scheduled', 'active', 'ended'], default: 'active' },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date
  }],
  actionItems: [actionItemSchema],
  summary: { type: String },
  transcript: { type: String },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Meeting', meetingSchema);