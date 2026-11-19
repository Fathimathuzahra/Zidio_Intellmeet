const prisma = require('../config/prisma');
const { canAccessTeam, canManageTeam } = require('../utils/teamAccess');
const projectInclude = { createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } }, team: { select: { id: true, name: true } }, tasks: { include: { assignedTo: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'asc' } } };
const idOf = (value) => value && String(value._id || value.id || value);
const taskStatus = (status) => ({ todo: 'todo', in_progress: 'in-progress', review: 'review', done: 'done' }[status] || 'todo');
function formatTask(task, project) {
  return { _id: task.id, title: task.title, description: task.description || '', status: taskStatus(task.status),
    assignedTo: task.assignedTo ? { _id: task.assignedTo.id, name: task.assignedTo.name, email: task.assignedTo.email } : undefined,
    dueDate: task.dueDate, priority: task.priority || 'Medium', createdAt: task.createdAt, updatedAt: task.updatedAt,
    ...(project ? { projectId: project.id, projectName: project.name } : {}) };
}
function formatProject(project, includeTasks = true) {
  return { _id: project.id, name: project.name, description: project.description || '', team: project.team ? { _id: project.team.id, name: project.team.name } : project.teamId,
    createdBy: project.createdBy ? { _id: project.createdBy.id, name: project.createdBy.name, email: project.createdBy.email, ...(project.createdBy.avatarUrl ? { avatarUrl: project.createdBy.avatarUrl } : {}) } : project.createdById,
    ...(includeTasks ? { tasks: (project.tasks || []).map((task) => formatTask(task)) } : {}), status: project.status, createdAt: project.createdAt, updatedAt: project.updatedAt };
}
async function getProjectAccess(project, user) {
  const team = project.teamId ? await prisma.team.findUnique({ where: { id: project.teamId }, include: { members: true } }) : null;
  const canAccess = user?.role === 'admin' || canAccessTeam(team, user);
  return { team, canAccess, canManage: canAccess && (user?.role === 'admin' || canManageTeam(team, user) || project.createdById === user.id) };
}
function canAssignToTeamMember(team, userId) { return Boolean(team && (team.ownerId === userId || team.members.some((m) => m.userId === userId))); }
async function createProject(req, res, next) {
  try {
    const { name, description, teamId } = req.body;
    if (!req.user?.id) return res.status(401).json({ message: 'User not authenticated' });
    const team = teamId ? await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } }) : null;
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (!canAccessTeam(team, req.user)) return res.status(403).json({ message: 'You are not a member of this team' });
    const project = await prisma.project.create({ data: { name, description: description || '', teamId, createdById: req.user.id }, include: projectInclude });
    res.status(201).json(formatProject(project));
  } catch (error) { console.error('Error creating project:', error); next(error); }
}
async function getProjectsByTeam(req, res, next) {
  try {
    const { teamId } = req.params;
    if (!teamId) return res.status(400).json({ message: 'Team ID is required' });
    if (!req.user?.id) return res.status(401).json({ message: 'User not authenticated' });
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (!canAccessTeam(team, req.user)) return res.status(403).json({ message: 'Access denied. You are not a member of this team.' });
    const projects = await prisma.project.findMany({ where: { teamId, status: 'active' }, orderBy: { createdAt: 'desc' }, include: projectInclude });
    res.json(projects.map((project) => formatProject(project)));
  } catch (error) { console.error('Error fetching projects:', error); next(error); }
}
async function getProjectById(req, res, next) {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id }, include: projectInclude });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!(await getProjectAccess(project, req.user)).canAccess) return res.status(403).json({ message: 'Access denied' });
    res.json(formatProject(project));
  } catch (error) { console.error('Error fetching project:', error); next(error); }
}
async function updateProject(req, res, next) {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Project not found' });
    if (!(await getProjectAccess(existing, req.user)).canManage) return res.status(403).json({ message: 'Only project creator or team owner can edit' });
    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    const project = await prisma.project.update({ where: { id: existing.id }, data, include: projectInclude });
    res.json(formatProject(project));
  } catch (error) { console.error('Error updating project:', error); next(error); }
}
async function deleteProject(req, res, next) {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!(await getProjectAccess(project, req.user)).canManage) return res.status(403).json({ message: 'Only project creator or team owner can delete' });
    await prisma.project.update({ where: { id: project.id }, data: { status: 'archived' } });
    res.json({ message: 'Project archived successfully' });
  } catch (error) { console.error('Error deleting project:', error); next(error); }
}
async function getAllProjects(req, res, next) {
  try {
    const teamIds = req.user.role === 'admin' ? undefined : (await prisma.team.findMany({ where: { OR: [{ ownerId: req.user.id }, { members: { some: { userId: req.user.id } } }] }, select: { id: true } })).map((t) => t.id);
    const projects = await prisma.project.findMany({ where: teamIds ? { teamId: { in: teamIds } } : {}, orderBy: { createdAt: 'desc' }, include: projectInclude });
    res.json(projects.map((project) => formatProject(project)));
  } catch (error) { console.error('Error fetching all projects:', error); next(error); }
}
async function addTask(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const { team, canAccess } = await getProjectAccess(project, req.user);
    if (!canAccess) return res.status(403).json({ message: 'Access denied' });
    const { title, description, assignedTo, dueDate, priority, status } = req.body;
    const state = { todo: 'todo', 'in-progress': 'in_progress', in_progress: 'in_progress', review: 'review', done: 'done' }[status?.toLowerCase()] || 'todo';
    const assignedToId = idOf(assignedTo);
    if (assignedToId && !canAssignToTeamMember(team, assignedToId)) return res.status(400).json({ message: 'Task assignee must belong to this team' });
    await prisma.projectTask.create({ data: { projectId, title, description: description || '', status: state, assignedToId: assignedToId || null, dueDate: dueDate ? new Date(dueDate) : null, priority: priority || 'Medium' } });
    const updated = await prisma.project.findUnique({ where: { id: projectId }, include: projectInclude });
    res.status(201).json(formatProject(updated));
  } catch (error) { console.error('Error adding task:', error); next(error); }
}
async function updateTask(req, res, next) {
  try {
    const { projectId, taskId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const { team, canAccess } = await getProjectAccess(project, req.user);
    if (!canAccess) return res.status(403).json({ message: 'Access denied' });
    const task = await prisma.projectTask.findFirst({ where: { id: taskId, projectId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const { title, description, status, assignedTo, dueDate, priority } = req.body;
    const data = {};
    if (status !== undefined) {
      if (typeof status !== 'string') return res.status(400).json({ message: 'Task status must be a string' });
      const state = { todo: 'todo', 'in-progress': 'in_progress', in_progress: 'in_progress', review: 'review', done: 'done' }[status.toLowerCase()];
      if (!state) return res.status(400).json({ message: 'Invalid task status' });
      data.status = state;
    }
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (assignedTo !== undefined) {
      const assignedToId = idOf(assignedTo);
      if (assignedToId && !canAssignToTeamMember(team, assignedToId)) return res.status(400).json({ message: 'Task assignee must belong to this team' });
      data.assignedToId = assignedToId || null;
    }
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) data.priority = priority;
    await prisma.projectTask.update({ where: { id: taskId }, data });
    res.json(formatProject(await prisma.project.findUnique({ where: { id: projectId }, include: projectInclude })));
  } catch (error) { console.error('Error updating task:', error); next(error); }
}
async function deleteTask(req, res, next) {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!(await getProjectAccess(project, req.user)).canAccess) return res.status(403).json({ message: 'Not authorized to delete tasks' });
    const deleted = await prisma.projectTask.deleteMany({ where: { id: req.params.taskId, projectId: project.id } });
    if (!deleted.count) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) { console.error('Error deleting task:', error); next(error); }
}
async function updateTaskStatus(req, res, next) {
  try {
    const { projectId, taskId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!(await getProjectAccess(project, req.user)).canAccess) return res.status(403).json({ message: 'Access denied' });
    const task = await prisma.projectTask.findFirst({ where: { id: taskId, projectId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const statusMap = { todo: 'todo', 'in-progress': 'in_progress', review: 'review', done: 'done' };
    const status = typeof req.body.status === 'string' ? statusMap[req.body.status.toLowerCase()] : undefined;
    if (!status) return res.status(400).json({ message: `Invalid status: ${req.body.status}. Allowed: ${Object.keys(statusMap).join(', ')}` });
    const updated = await prisma.projectTask.update({ where: { id: task.id }, data: { status } });
    res.json({ success: true, message: 'Task status updated successfully', task: { _id: updated.id, taskId: updated.id, title: updated.title, status: updated.status, updatedAt: updated.updatedAt } });
  } catch (error) { console.error('Error updating task status:', error); next(error); }
}
async function getProjectTasks(req, res, next) {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId }, include: { createdBy: true, team: { include: { members: true } }, tasks: { include: { assignedTo: true } } } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!(await getProjectAccess(project, req.user)).canAccess) return res.status(403).json({ message: 'Access denied' });
    const tasks = project.tasks.map((task) => formatTask(task, project));
    res.json({ projectId: project.id, projectName: project.name, projectDescription: project.description || '', totalTasks: tasks.length, tasks,
      stats: { todo: tasks.filter((t) => t.status === 'todo').length, inProgress: tasks.filter((t) => t.status === 'in-progress').length, review: tasks.filter((t) => t.status === 'review').length, done: tasks.filter((t) => t.status === 'done').length } });
  } catch (error) { console.error('Error fetching project tasks:', error); next(error); }
}
async function getTeamTasks(req, res, next) {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.teamId }, include: { members: true } });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (!canAccessTeam(team, req.user)) return res.status(403).json({ message: 'Access denied' });
    const projects = await prisma.project.findMany({ where: { teamId: team.id, status: 'active' }, select: { id: true, name: true, tasks: { include: { assignedTo: true } } } });
    const tasks = projects.flatMap((project) => project.tasks.map((task) => formatTask(task, project))).sort((a, b) => b.createdAt - a.createdAt);
    res.json({ teamId: team.id, teamName: team.name, totalTasks: tasks.length, tasks });
  } catch (error) { console.error('Error fetching team tasks:', error); next(error); }
}
async function getMyTasks(req, res, next) {
  try {
    const tasks = await prisma.projectTask.findMany({ where: { assignedToId: req.user.id, project: { status: 'active' } }, include: { assignedTo: true, project: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ totalTasks: tasks.length, tasks: tasks.map((task) => formatTask(task, task.project)) });
  } catch (error) { console.error('Error fetching my tasks:', error); next(error); }
}
async function getUserTasksInTeam(req, res, next) {
  try {
    const { teamId, userId } = req.params;
    const targetUserId = userId || req.user.id;
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (!canAccessTeam(team, req.user)) return res.status(403).json({ message: 'Access denied' });
    const projects = await prisma.project.findMany({ where: { teamId, status: 'active' }, include: { tasks: { where: { assignedToId: targetUserId }, include: { assignedTo: true } } } });
    const tasks = projects.flatMap((project) => project.tasks.map((task) => ({ ...formatTask(task, project), taskId: task.id })));
    res.json({ userId: targetUserId, teamId, teamName: team.name, totalTasks: tasks.length, tasks });
  } catch (error) { console.error('Error fetching user tasks:', error); next(error); }
}
module.exports = { createProject, getProjectsByTeam, getProjectById, updateProject, deleteProject, getAllProjects, addTask, updateTask, deleteTask, updateTaskStatus, getProjectTasks, getTeamTasks, getUserTasksInTeam, getMyTasks };
