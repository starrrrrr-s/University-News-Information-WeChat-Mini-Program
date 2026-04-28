const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// 模拟数据
const mockData = {
  news: [
    {
      id: 1,
      title: '学校召开2026年春季学期工作会议',
      content: '3月1日，学校召开2026年春季学期工作会议，部署新学期重点工作。',
      category: '学校要闻',
      author: '校办',
      date: '2026-03-01',
      views: 1234
    },
    {
      id: 2,
      title: '我校教师在国际学术会议上发表重要研究成果',
      content: '近日，我校教授在国际学术会议上发表了关于人工智能的最新研究成果。',
      category: '学术动态',
      author: '科研处',
      date: '2026-02-28',
      views: 890
    }
  ],
  lectures: [
    {
      id: 1,
      title: '人工智能与未来教育',
      speaker: '张教授',
      location: '学术报告厅',
      time: '2026-03-10 14:00',
      category: '学术讲座',
      is_free: 1
    }
  ],
  categories: [
    { id: 1, name: '学校要闻' },
    { id: 2, name: '学术动态' },
    { id: 3, name: '教学园地' },
    { id: 4, name: '校园文化' },
    { id: 5, name: '人物风采' }
  ]
};

// 处理请求
const handleRequest = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 健康检查
  if (pathname === '/api/health') {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, message: '服务正常运行' }));
    return;
  }

  // 获取新闻列表
  if (pathname === '/api/news') {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: mockData.news }));
    return;
  }

  // 获取讲座列表
  if (pathname === '/api/lectures') {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: mockData.lectures }));
    return;
  }

  // 获取分类列表
  if (pathname === '/api/categories') {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: mockData.categories }));
    return;
  }

  // 404
  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, message: '接口不存在' }));
};

// 创建服务器
const server = http.createServer(handleRequest);

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('简化版后端服务已启动');
  console.log('可用接口:');
  console.log('GET /api/health - 健康检查');
  console.log('GET /api/news - 获取新闻列表');
  console.log('GET /api/lectures - 获取讲座列表');
  console.log('GET /api/categories - 获取分类列表');
});