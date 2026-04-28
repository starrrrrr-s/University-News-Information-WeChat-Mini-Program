const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 获取讲座列表
router.get('/', lectureController.getLectureList);

// 获取讲座详情
router.get('/:id', lectureController.getLectureDetail);

// 新增讲座（管理员）
router.post('/', auth, admin, lectureController.createLecture);

// 更新讲座（管理员）
router.put('/:id', auth, admin, lectureController.updateLecture);

// 删除讲座（管理员）
router.delete('/:id', auth, admin, lectureController.deleteLecture);

module.exports = router;