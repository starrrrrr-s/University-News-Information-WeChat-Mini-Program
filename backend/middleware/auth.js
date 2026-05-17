const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // 获取 Authorization header
    const authHeader = req.header('Authorization');
    
    // 检查 header 是否存在
    if (!authHeader) {
      console.log('认证失败：缺少 Authorization header');
      return res.status(401).json({ success: false, message: '请先登录' });
    }

    // 提取 token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('认证失败：token 为空');
      return res.status(401).json({ success: false, message: '请先登录' });
    }

    // 验证 token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.secret);
    } catch (jwtError) {
      console.log('认证失败：token 无效或过期');
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
    }

    // 查找用户
    const user = await User.findByPk(decoded.id);

    if (!user) {
      console.log('认证失败：用户不存在');
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(401).json({ success: false, message: '认证失败' });
  }
};

module.exports = auth;