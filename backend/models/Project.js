const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ["todo", "in_progress","review", "done"], 
    default: "todo" 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dueDate: { type: Date },
   priority: {
    type: String,
    enum: ["Critical", "High", "Medium", "Low"],
    default: "Medium"
  }
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tasks: [TaskSchema],
  status: {
    type: String,
    enum: ['active', 'archived', 'completed'],
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Project", ProjectSchema);