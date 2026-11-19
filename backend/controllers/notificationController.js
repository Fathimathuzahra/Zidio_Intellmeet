const prisma = require('../config/prisma');
const { toApi } = require('../utils/apiSerialization');
const getNotifications = async (req, res, next) => {
  try {
    const items = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(toApi(items));
  } catch (error) { next(error); }
};
const markAsRead = async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { isRead: true } });
    if (!result.count) return res.status(404).json({ message: 'Notification not found' });
    res.json(toApi(await prisma.notification.findUnique({ where: { id: req.params.id } })));
  } catch (error) { next(error); }
};
const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};
const deleteNotification = async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Notification deleted' });
  } catch (error) { next(error); }
};
module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
