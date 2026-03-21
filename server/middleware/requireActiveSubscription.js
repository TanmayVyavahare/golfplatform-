const requireActiveSubscription = (req, res, next) => {
  if (!req.user || req.user.subscription_status !== 'active') {
    return res.status(403).json({ error: 'Active subscription required. Please subscribe or renew.' });
  }
  next();
};

module.exports = { requireActiveSubscription };
