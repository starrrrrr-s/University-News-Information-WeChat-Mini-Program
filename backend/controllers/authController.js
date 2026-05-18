const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');
const { success, error } = require('../utils/response');

// 微信登录
const login = async (req, res) => {
  try {
    const { code, nickname, avatar_url } = req.body;
    if (!code) {
      return error(res, '缺少code参数');
    }

    let openid = null;
    
    // 开发测试模式：检测测试code或开发环境
    if (code.startsWith('test_') || process.env.NODE_ENV === 'development') {
      // 使用code作为openid（测试用）
      openid = code;
      console.log('开发测试模式，使用测试openid:', openid);
    } else {
      // 调用微信接口获取openid
      const response = await axios.get(
        `https://api.weixin.qq.com/sns/jscode2session`,
        {
          params: {
            appid: process.env.WECHAT_APPID,
            secret: process.env.WECHAT_SECRET,
            js_code: code,
            grant_type: 'authorization_code'
          }
        }
      );

      openid = response.data.openid;
      if (!openid) {
        // 如果微信接口失败，使用随机openid作为降级
        openid = 'test_openid_' + Math.floor(Math.random() * 10000);
        console.log('微信接口失败，使用降级openid:', openid);
      }
    }

    // 查找或创建用户
    let user = await User.findOne({ where: { openid } });
    if (!user) {
      // 新用户：使用微信昵称和头像（如果有）
      const nicknameToUse = nickname || '用户' + Math.floor(Math.random() * 10000);
      user = await User.create({
        openid,
        nickname: nicknameToUse,
        avatar_url: avatar_url || ''
      });
      console.log('创建新用户:', user.nickname);
    } else {
      // 老用户：不更新昵称和头像，保留用户之前修改的内容
      // 只有当数据库中没有昵称或头像时，才使用微信信息
      if (!user.nickname && nickname) {
        await user.update({ nickname });
      }
      if (!user.avatar_url && avatar_url) {
        await user.update({ avatar_url });
      }
    }

    // 生成token
    const token = jwt.sign(
      { id: user.id, openid: user.openid },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return success(res, {
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin
      }
    }, '登录成功');
  } catch (err) {
    console.error('登录失败:', err);
    return error(res, '登录失败');
  }
};

// 获取用户信息
const getUserInfo = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return error(res, '用户不存在');
    }

    return success(res, {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      is_admin: user.is_admin
    }, '获取用户信息成功');
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return error(res, '获取用户信息失败');
  }
};

// 更新用户信息
const updateUserInfo = async (req, res) => {
  try {
    const { nickname, avatar_url } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return error(res, '用户不存在');
    }

    await user.update({
      nickname: nickname || user.nickname,
      avatar_url: avatar_url || user.avatar_url
    });

    return success(res, {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      is_admin: user.is_admin
    }, '更新用户信息成功');
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return error(res, '更新用户信息失败');
  }
};

// 管理员账号密码登录
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return error(res, '缺少用户名或密码');
    }

    // 查找管理员用户
    const user = await User.findOne({ 
      where: { 
        username, 
        is_admin: true 
      } 
    });

    if (!user) {
      return error(res, '管理员账号不存在');
    }

    // 验证密码
    const bcrypt = require('bcryptjs');
    if (!user.password || !bcrypt.compareSync(password, user.password)) {
      return error(res, '密码错误');
    }

    // 生成token
    const token = jwt.sign(
      { id: user.id, openid: user.openid },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return success(res, {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin
      }
    }, '管理员登录成功');
  } catch (err) {
    console.error('管理员登录失败:', err);
    return error(res, '登录失败');
  }
};

module.exports = {
  login,
  adminLogin,
  getUserInfo,
  updateUserInfo
};