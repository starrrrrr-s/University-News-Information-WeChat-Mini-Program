const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/theme', configController.getThemeColor);

router.put('/theme', auth, admin, configController.updateThemeColor);

router.get('/theme/presets', configController.getPresetColors);

module.exports = router;