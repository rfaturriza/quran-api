const {
  scheduleGeneralNotifications,
  scheduleFastingNotifications
} = require('../services/notificationService');

module.exports = class NotificationHandler {
  static async general(req, res) {
    try {
      await scheduleGeneralNotifications();
      res
        .status(200)
        .json({
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
      res
        .status(200)
        .json({
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
