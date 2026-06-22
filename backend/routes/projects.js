const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
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
} = require("../controllers/projectController");


router.get("/", protect, getAllProjects);
router.post("/", protect, createProject);

router.get("/team/:teamId", protect, getProjectsByTeam);

router.get("/:id", protect, getProjectById);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);


router.get("/tasks/team/:teamId/me", protect, (req, res, next) => {
  req.params.userId = req.user.id;
  getUserTasksInTeam(req, res, next);
});

router.get("/tasks/me", protect, getMyTasks);

router.get("/tasks/team/:teamId/user/:userId", protect, getUserTasksInTeam);

router.get("/tasks/team/:teamId", protect, getTeamTasks);


router.get("/:projectId/tasks", protect, getProjectTasks);
router.post("/:projectId/tasks", protect, addTask);
router.put("/:projectId/tasks/:taskId", protect, updateTask);
router.patch("/:projectId/tasks/:taskId/status", protect, updateTaskStatus);
router.delete("/:projectId/tasks/:taskId", protect, deleteTask);

module.exports = router;