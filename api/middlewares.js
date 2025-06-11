const cache = {};

const caching = (req, res, next) => {
  const key = req.url;

  if (cache[key]) {
    return res.status(200).send(cache[key]);
  }

  res.sendResponse = res.send;
  res.send = (body) => {
    cache[key] = body;
    res.sendResponse(body);
  };

  next();
};

// Middleware to protect notification endpoints
function verifyNotificationSecret(req, res, next) {
  const secret = process.env.NOTIFICATION_SECRET;
  const token = req.header('x-notification-secret') || req.query.secret;
  if (token && secret && token === secret) {
    return next();
  }
  return res
    .status(401)
    .json({
      code: 401,
      status: 'UNAUTHORIZED',
      message: 'Invalid notification secret.'
    });
}

module.exports = {
  caching,
  verifyNotificationSecret
};
