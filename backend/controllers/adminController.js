const User = require('../models/User');
const { success, error } = require('../utils/response');

// 获取用户列表
const getUserList = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['id', 'ASC']]
    });

    return success(res, users, '获取用户列表成功');
  } catch (err) {
    console.error('获取用户列表失败:', err);
    return error(res, '获取用户列表失败');
  }
};

// 更新用户权限
const updateUserPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_admin } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return error(res, '用户不存在');
    }

    await user.update({
      is_admin: is_admin !== undefined ? is_admin : user.is_admin
    });

    return success(res, user, '更新用户权限成功');
  } catch (err) {
    console.error('更新用户权限失败:', err);
    return error(res, '更新用户权限失败');
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return error(res, '用户不存在');
    }

    await user.destroy();
    return success(res, null, '删除用户成功');
  } catch (err) {
    console.error('删除用户失败:', err);
    return error(res, '删除用户失败');
  }
};

module.exports = {
  getUserList,
  updateUserPermission,
  deleteUser
};