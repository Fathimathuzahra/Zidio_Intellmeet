const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { toApi } = require('../utils/apiSerialization');
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, omit: { password: true } });
    res.json(toApi(user));
  } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
};
const updateMe = async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    const user = await prisma.user.update({ where: { id: req.user.id }, data, omit: { password: true } });
    res.json(toApi(user));
  } catch (error) { console.error(error); res.status(error.code === 'P2025' ? 404 : 500).json({ message: error.code === 'P2025' ? 'User not found' : 'Server error' }); }
};
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await prisma.user.update({ where: { id: req.params.userId }, data: { role }, select: { id: true, role: true } });
    res.json({ message: 'Role updated successfully', user: { id: user.id, role: user.role } });
  } catch (error) { console.error(error); res.status(error.code === 'P2025' ? 404 : 500).json({ message: error.code === 'P2025' ? 'User not found' : 'Server error' }); }
};
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current password and new password are required' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.password) return res.status(400).json({ message: 'This account uses OAuth (Google/GitHub). No password to change.' });
    if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ message: 'Current password is incorrect' });
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newPassword, await bcrypt.genSalt(10)), tokenVersion: { increment: 1 } } });
    res.json({ message: 'Password updated successfully' });
  } catch (error) { console.error('Error updating password:', error); res.status(500).json({ message: 'Server error', error: error.message }); }
};
const deleteMe = async (req, res) => {
  try { await prisma.user.delete({ where: { id: req.user.id } }); res.json({ message: 'Account deleted successfully' }); }
  catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
};
module.exports = { getMe, updateMe, updateRole, updatePassword, deleteMe };
