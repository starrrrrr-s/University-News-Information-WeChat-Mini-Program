const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 获取分类列表
router.get('/', categoryController.getCategoryList);

// 新增分类（管理员）
router.post('/', auth, admin, categoryController.createCategory);

// 更新分类（管理员）
router.put('/:id', auth, admin, categoryController.updateCategory);

// 删除分类（管理员）
router.delete('/:id', auth, admin, categoryController.deleteCategory);

module.exports = router;