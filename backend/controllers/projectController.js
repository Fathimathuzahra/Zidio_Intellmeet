const Project = require("../models/Project");
const Team = require("../models/Team");

const createProject = async (req, res, next) => {
  try {
    const { name, description, teamId } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    const isOwner = team.owner.toString() === req.user.id;
    
    if (!isMember && !isOwner) {
      return res.status(403).json({ message: "You are not a member of this team" });
    }
    
    const newProject = new Project({
      name,
      description: description || '',
      team: teamId,
      createdBy: req.user.id
    });

    const savedProject = await newProject.save();
    console.log("Project created:", savedProject,"for team:", team);
    
    const populatedProject = await Project.findById(savedProject._id)
      .populate('createdBy', 'name email')
      .populate('team', 'name');
    
    res.status(201).json(populatedProject);
  } catch (error) {
    console.error("Error creating project:", error);
    next(error);
  }
};

const getProjectsByTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ message: "Team ID is required" });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    console.log(`Fetching projects for team: ${teamId}, user: ${req.user.id}`);
    
    const team = await Team.findById(teamId).populate('members.user', '_id');
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    const userId = req.user.id.toString();
    const isOwner = team.owner.toString() === userId;
    const isMember = team.members.some(member => 
      member.user._id.toString() === userId
    );
    
    console.log(`User ${userId} - isOwner: ${isOwner}, isMember: ${isMember}`);
    
    if (!isMember && !isOwner) {
      return res.status(403).json({ 
        message: "Access denied. You are not a member of this team." 
      });
    }
    
    const projects = await Project.find({ 
      team: teamId, 
      status: 'active' 
    })
    .populate('createdBy', 'name email avatarUrl')
    .populate('team', 'name')
    .sort({ createdAt: -1 });
    
    const normalizeTaskStatus = (status) => {
      const statusMap = {
        'TODO': 'todo',
        'IN-PROGRESS': 'in-progress',
        'IN_PROGRESS': 'in-progress',
        'REVIEW': 'review',
        'DONE': 'done'
      };
      return statusMap[status?.toUpperCase()] || 'todo';
    };
    
    const formattedProjects = projects.map(project => {
      const projectObj = project.toObject();
      
      const normalizedTasks = (projectObj.tasks || []).map(task => ({
        ...task,
        status: normalizeTaskStatus(task.status)
      }));
      
      return {
        ...projectObj,
        tasks: normalizedTasks
      };
    });
    
    console.log(`Found ${formattedProjects.length} projects for team ${team.name}`);
    
    res.json(formattedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findById(id)
      .populate('createdBy', 'name email')
      .populate('team', 'name')
      .populate('tasks.assignedTo', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    const isOwner = team.owner.toString() === req.user.id;
    const isCreator = project.createdBy._id.toString() === req.user.id;
    
    if (!isMember && !isOwner && !isCreator) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const team = await Team.findById(project.team);
    const isOwner = team.owner.toString() === req.user.id;
    const isCreator = project.createdBy.toString() === req.user.id;
    
    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: "Only project creator or team owner can edit" });
    }
    
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { 
        name: name || project.name,
        description: description !== undefined ? description : project.description,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email').populate('team', 'name');
    
    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const team = await Team.findById(project.team);
    const isOwner = team.owner.toString() === req.user.id;
    const isCreator = project.createdBy.toString() === req.user.id;
    
    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: "Only project creator or team owner can delete" });
    }
    
    project.status = 'archived';
    await project.save();
    
    res.json({ message: "Project archived successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    next(error);
  }
};

const getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .populate('team', 'name')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    console.error("Error fetching all projects:", error);
    next(error);
  }
};


const addTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, dueDate, priority, status } = req.body;
    
    console.log("Adding task with data:", { title, description, assignedTo, dueDate, priority, status });
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const statusMap = {
      'todo': 'todo',
      'in-progress': 'in_progress',
      'in_progress': 'in_progress',
      'review': 'review',
      'done': 'done'
    };
    
    const backendStatus = statusMap[status?.toLowerCase()] || 'todo';
    
    let assignedToId = null;
    if (assignedTo) {
      assignedToId = typeof assignedTo === 'string' ? assignedTo : assignedTo._id;
    }
    console.log("Original status from frontend:", status);
    console.log("Converted status:", backendStatus);
    console.log("AssignedTo:", assignedTo);
    console.log("AssignedTo ID:", assignedToId);
        
    const newTask = {
      title,
      description: description || '',
      status: backendStatus,
      assignedTo: assignedToId,
      dueDate: dueDate || null,
      priority: priority || 'Medium'
    };
    
    console.log("Saving task:", newTask);
    
    project.tasks.push(newTask);
    await project.save();
    
    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('team', 'name')
      .populate('tasks.assignedTo', 'name email');
    
    console.log("Task saved successfully");
    
    res.status(201).json(updatedProject);
  } catch (error) {
    console.error("Error adding task:", error);
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const { title, description, status, assignedTo, dueDate, priority } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;
    task.updatedAt = new Date();
    
    await project.save();
    
    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('tasks.assignedTo', 'name email');
    
    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating task:", error);
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    const isOwner = team.owner.toString() === req.user.id;
    const isCreator = project.createdBy.toString() === req.user.id;
    
    if (!isMember && !isOwner && !isCreator) {
      return res.status(403).json({ message: "Not authorized to delete tasks" });
    }
    
    project.tasks.id(taskId).deleteOne();
    await project.save();
    
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const { status } = req.body;
    
    console.log(`Updating task ${taskId} to status: ${status}`);
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status: ${status}. Allowed: ${validStatuses.join(', ')}` 
      });
    }
    
    task.status = status;
    task.updatedAt = new Date();
    await project.save();
    
    console.log(`Task ${taskId} status updated to ${task.status}`);
    
    res.json({
      success: true,
      message: "Task status updated successfully",
      task: {
        _id: task._id,
        taskId: task._id,
        title: task.title,
        status: task.status,
        updatedAt: task.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    next(error);
  }
};

const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId)
      .populate('createdBy', 'name email')
      .populate('team', 'name')
      .populate('tasks.assignedTo', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const team = await Team.findById(project.team);
    const userId = req.user.id.toString();
    const isMember = team.members.some(m => m.user.toString() === userId);
    const isOwner = team.owner.toString() === userId;
    const isCreator = project.createdBy._id.toString() === userId;
    
    if (!isMember && !isOwner && !isCreator) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const normalizeStatus = (status) => {
      const statusMap = {
        'TODO': 'todo',
        'IN-PROGRESS': 'in-progress',
        'IN_PROGRESS': 'in-progress',
        'REVIEW': 'review',
        'DONE': 'done'
      };
      return statusMap[status?.toUpperCase()] || 'todo';
    };
    
    const formattedTasks = project.tasks.map(task => {
      const taskObj = task.toObject();
      return {
        _id: taskObj._id,
        taskId: taskObj._id,
        title: taskObj.title,
        description: taskObj.description || '',
        status: normalizeStatus(taskObj.status),
        priority: taskObj.priority || 'Medium',
        assignedTo: taskObj.assignedTo ? {
          _id: taskObj.assignedTo._id,
          name: taskObj.assignedTo.name,
          email: taskObj.assignedTo.email
        } : undefined,
        dueDate: taskObj.dueDate,
        createdAt: taskObj.createdAt,
        updatedAt: taskObj.updatedAt,
        projectId: project._id,
        projectName: project.name
      };
    });
    
    const stats = {
      todo: formattedTasks.filter(t => t.status === 'TODO').length,
      inProgress: formattedTasks.filter(t => t.status === 'IN_PROGRESS').length,
      review: formattedTasks.filter(t => t.status === 'REVIEW').length,
      done: formattedTasks.filter(t => t.status === 'DONE').length
    };
    
    console.log(`Found ${formattedTasks.length} tasks for project ${project.name}`);
    
    res.json({
      projectId: project._id,
      projectName: project.name,
      projectDescription: project.description || '',
      totalTasks: formattedTasks.length,
      tasks: formattedTasks,
      stats
    });
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    next(error);
  }
};

const getTeamTasks = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    const userId = req.user.id.toString();
    const isMember = team.members.some(m => m.user.toString() === userId);
    const isOwner = team.owner.toString() === userId;
    
    if (!isMember && !isOwner) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const projects = await Project.find({ 
      team: teamId, 
      status: 'active' 
    })
    .select('_id name tasks')
    .populate('tasks.assignedTo', 'name email');
    
    const normalizeStatus = (status) => {
      const statusMap = {
        'TODO': 'todo',
        'IN-PROGRESS': 'in-progress',
        'IN_PROGRESS': 'in-progress',
        'REVIEW': 'review',
        'DONE': 'done'
      };
      return statusMap[status?.toUpperCase()] || 'todo';
    };
    
    const allTasks = [];
    projects.forEach(project => {
      const tasksWithProject = project.tasks.map(task => {
        const taskObj = task.toObject();
        
        let assignedToData = undefined;
        if (taskObj.assignedTo) {
          if (typeof taskObj.assignedTo === 'object' && taskObj.assignedTo._id) {
            assignedToData = {
              _id: taskObj.assignedTo._id,
              name: taskObj.assignedTo.name || 'Unknown',
              email: taskObj.assignedTo.email || ''
            };
          } else if (typeof taskObj.assignedTo === 'string') {
            assignedToData = {
              _id: taskObj.assignedTo,
              name: 'Unknown',
              email: ''
            };
          }
        }
        
        return {
          _id: taskObj._id,
          taskId: taskObj._id,
          title: taskObj.title,
          description: taskObj.description || '',
          status: normalizeStatus(taskObj.status),
          priority: taskObj.priority || 'Medium',
          assignedTo: assignedToData,
          dueDate: taskObj.dueDate,
          createdAt: taskObj.createdAt,
          updatedAt: taskObj.updatedAt,
          projectId: project._id,
          projectName: project.name
        };
      });
      allTasks.push(...tasksWithProject);
    });
    
    allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`Found ${allTasks.length} tasks for team ${team.name}`);
    
    res.json({
      teamId,
      teamName: team.name,
      totalTasks: allTasks.length,
      tasks: allTasks
    });
  } catch (error) {
    console.error("Error fetching team tasks:", error);
    next(error);
  }
};



const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    console.log(`Fetching tasks assigned to user: ${userId}`);
    
    const projects = await Project.find({ 
      status: 'active',
      'tasks.assignedTo': userId 
    })
    .select('_id name tasks')
    .populate('tasks.assignedTo', 'name email');
    
    const myTasks = [];
    projects.forEach(project => {
      const userTasks = project.tasks.filter(task => 
        task.assignedTo && task.assignedTo._id.toString() === userId
      );
      
      userTasks.forEach(task => {
        myTasks.push({
          _id: task._id,
          taskId: task._id,
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority || 'Medium',
          assignedTo: {
            _id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email
          },
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          projectId: project._id,
          projectName: project.name
        });
      });
    });
    

    const normalizeStatus = (status) => {
      const statusMap = {
        'TODO': 'todo',
        'IN_PROGRESS': 'in-progress',
        'IN_PROGRESS': 'in-progress',
        'REVIEW': 'review',
        'DONE': 'done'
      };
      return statusMap[status?.toUpperCase()] || 'todo';
    };
    
    const normalizedTasks = myTasks.map(task => ({
      ...task,
      status: normalizeStatus(task.status)
    }));
    
    console.log(`Found ${normalizedTasks.length} tasks assigned to user ${userId}`);
    
    res.json({
      totalTasks: normalizedTasks.length,
      tasks: normalizedTasks
    });
  } catch (error) {
    console.error("Error fetching my tasks:", error);
    next(error);
  }
};


const getUserTasksInTeam = async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;
    const targetUserId = userId || req.user.id;
    
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    const currentUserId = req.user.id.toString();
    const isMember = team.members.some(m => m.user.toString() === currentUserId);
    const isOwner = team.owner.toString() === currentUserId;
    
    if (!isMember && !isOwner) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const projects = await Project.find({ 
      team: teamId, 
      status: 'active' 
    }).select('_id name tasks');
    
    const assignedTasks = [];
    projects.forEach(project => {
      const userTasks = project.tasks.filter(task => 
        task.assignedTo && task.assignedTo.toString() === targetUserId
      );
      
      userTasks.forEach(task => {
        assignedTasks.push({
          ...task.toObject(),
          projectId: project._id,
          projectName: project.name,
          taskId: task._id
        });
      });
    });
    
    res.json({
      userId: targetUserId,
      teamId,
      teamName: team.name,
      totalTasks: assignedTasks.length,
      tasks: assignedTasks
    });
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    next(error);
  }
};

module.exports = {

  createProject,
  getProjectsByTeam,
  getProjectById,
  updateProject,
  deleteProject,
  getAllProjects,

  addTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getProjectTasks,
  getTeamTasks,
  getUserTasksInTeam,
  getMyTasks  
};