const express = require("express");
const protect = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const {
  getMe,
  updateMe,
  updateRole,
  updatePassword,
  deleteMe
} = require("../controllers/usersController");

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/me/password", protect, updatePassword);
router.delete("/me", protect, deleteMe);
router.put("/:userId/role", protect, authorizeRoles("admin"), updateRole);

module.exports = router;
