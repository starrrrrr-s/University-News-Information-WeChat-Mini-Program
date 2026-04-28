const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 获取用户列表
router.get('/users', auth, admin, adminController.getUserList);

// 更新用户权限
router.put('/users/:id', auth, admin, adminController.updateUserPermission);

// 删除用户
router.delete('/users/:id', auth, admin, adminController.deleteUser);

module.exports = router;