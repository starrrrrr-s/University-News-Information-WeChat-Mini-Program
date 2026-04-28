const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const auth = require('../middleware/auth');

// 获取用户收藏列表
router.get('/', auth, collectionController.getCollectionList);

// 添加收藏
router.post('/', auth, collectionController.addCollection);

// 删除收藏
router.delete('/:id', auth, collectionController.deleteCollection);

// 批量删除收藏
router.post('/batch-delete', auth, collectionController.batchDeleteCollection);

module.exports = router;