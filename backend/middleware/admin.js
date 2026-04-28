const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  if (req.user.is_admin !== 1) {
    return res.status(403).json({ success: false, message: '无权限操作' });
  }

  next();
};

module.exports = admin;