const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const lectureRoutes = require('./routes/lecture');
const categoryRoutes = require('./routes/category');
const collectionRoutes = require('./routes/collection');
const adminRoutes = require('./routes/admin');

// 导入模型
const User = require('./models/User');
const Category = require('./models/Category');
const News = require('./models/News');
const Lecture = require('./models/Lecture');
const Collection = require('./models/Collection');

const app = express();
const PORT = process.env.PORT || 3000;

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

    // 初始化分类数据
    const categories = [
      { name: '学校要闻' },
      { name: '学术动态' },
      { name: '教学园地' },
      { name: '校园文化' },
      { name: '人物风采' }
    ];

    for (const category of categories) {
      await Category.findOrCreate({ where: { name: category.name } });
    }

    console.log('初始化分类数据成功');
  } catch (error) {
    console.error('数据库同步失败:', error);
  }
};

syncDatabase();

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;