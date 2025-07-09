const {
  sendNotification,
  scheduleGeneralNotifications,
  scheduleFastingNotifications
} = require('../services/notificationService');

module.exports = class NotificationHandler {
  static async manual(req, res) {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({
        code: 400,
        status: 'ERROR',
        message: 'Title and body are required.'
      });
    }

    try {
      let content = {
        title: title,
        body: body,
        topic: 'daily-general'
      };
      await sendNotification(content);
      res.status(200).json({
        code: 200,
        status: 'OK',
        message: 'Manual notification sent.'
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error sending manual notification:', err);
      res
        .status(500)
        .json({ code: 500, status: 'ERROR', message: err.message });
    }
  }

  static async general(req, res) {
    try {
      await scheduleGeneralNotifications();
      res.status(200).json({
        code: 200,
        status: 'OK',
        message: 'General notification sent.'
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      res
        .status(500)
        .json({ code: 500, status: 'ERROR', message: err.message });
    }
  }

  static async fasting(req, res) {
    try {
      await scheduleFastingNotifications();
      res.status(200).json({
        code: 200,
        status: 'OK',
        message: 'Fasting notification sent if applicable.'
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      res
        .status(500)
        .json({ code: 500, status: 'ERROR', message: err.message });
    }
  }
};
