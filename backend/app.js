const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const lectureRoutes = require('./routes/lecture');
const categoryRoutes = require('./routes/category');
const collectionRoutes = require('./routes/collection');
const adminRoutes = require('./routes/admin');
const commentRoutes = require('./routes/comment');
const configRoutes = require('./routes/config');
const feedbackRoutes = require('./routes/feedback');

const User = require('./models/User');
const Category = require('./models/Category');
const News = require('./models/News');
const Lecture = require('./models/Lecture');
const Collection = require('./models/Collection');
const Comment = require('./models/Comment');
const AppConfig = require('./models/AppConfig');
const Feedback = require('./models/Feedback');
const configController = require('./controllers/configController');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/feedback', feedbackRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: '服务正常运行' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 同步数据库
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('数据库同步成功');

    // 初始化分类数据（如果不存在）
    const categories = [
      { id: 1, name: '立德树人' },
      { id: 2, name: '科技创新' },
      { id: 3, name: '媒体地大' }
    ];

    for (const category of categories) {
      await Category.findOrCreate({
        where: { id: category.id },
        defaults: category
      });
    }

    console.log('初始化分类数据成功');

    await configController.initDefaultConfig();
  } catch (error) {
    console.error('数据库初始化警告:', error.message);
  }
};

syncDatabase();

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;