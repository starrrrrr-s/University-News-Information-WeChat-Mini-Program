const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');
const { success, error } = require('../utils/response');

// 微信登录
const login = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return error(res, '缺少code参数');
    }

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

    const { openid, session_key } = response.data;
    if (!openid) {
      return error(res, '获取openid失败');
    }

    // 查找或创建用户
    let user = await User.findOne({ where: { openid } });
    if (!user) {
      user = await User.create({
        openid,
        nickname: '用户' + Math.floor(Math.random() * 10000),
        avatar_url: ''
      });
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

module.exports = {
  login,
  getUserInfo,
  updateUserInfo
};