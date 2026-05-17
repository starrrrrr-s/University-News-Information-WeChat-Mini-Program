/**
 * 数据管理模块
 * 使用 Storage 实现运行时数据持久化，初始数据作为默认值
 */

const STORAGE_KEY_NEWS = 'news_data';
const STORAGE_KEY_LECTURES = 'lecture_data';

// ==================== 初始新闻数据 ====================
const defaultNewsData = [
  {
    id: 1,
    title: '学校召开2024年春季学期工作会议',
    summary: '3月15日，学校在学术报告厅召开2024年春季学期工作会议，总结上学期工作，部署新学期重点任务...',
    content: '3月15日，学校在学术报告厅召开2024年春季学期工作会议。校长张华教授出席会议并讲话，副校长李明主持会议。张华校长强调，要坚持以习近平新时代中国特色社会主义思想为指导，全面贯彻党的教育方针，落实立德树人根本任务。会议指出，本学期将重点推进学科建设、科研创新、人才培养等方面工作，努力实现学校高质量发展新突破。会上，各学院负责人还汇报了新学期工作计划。',
    category: '立德树人',
    categoryId: 1,
    image: '/images/news1.jpg',
    author: '党委宣传部',
    date: '2024-03-15',
    views: 1256
  },
  {
    id: 2,
    title: '我校获批国家级科研项目再创新高',
    summary: '近日，从国家自然科学基金委员会传来好消息，我校2024年获批国家级科研项目数量再创历史新高...',
    content: '近日，从国家自然科学基金委员会传来好消息，我校2024年获批国家级科研项目数量再创历史新高。本次共获批各类国家级科研项目58项，其中重点项目3项，面上项目28项，青年基金27项，获批总经费超过5000万元。这一成绩标志着我校科研实力和学术水平迈上新台阶。近年来，学校高度重视科研工作，不断加大科研投入，完善科研激励机制，加强科研平台建设，为广大教师创造良好的科研环境。',
    category: '科技创新',
    categoryId: 2,
    image: '/images/news2.jpg',
    author: '科研处',
    date: '2024-03-14',
    views: 986
  },
  {
    id: 3,
    title: '教务处发布2024年课程改革实施方案',
    summary: '为深化教育教学改革，提高人才培养质量，教务处近日发布了《2024年课程改革实施方案》...',
    content: '为深化教育教学改革，提高人才培养质量，教务处近日发布了《2024年课程改革实施方案》。方案提出，要全面推进一流本科课程建设，打造一批具有高阶性、创新性和挑战度的精品课程。本次课程改革重点包括：优化课程体系，更新教学内容，改进教学方法，完善评价机制等方面。教务处将组织专家对改革效果进行跟踪评估，确保改革措施落地见效。',
    category: '学术动态',
    categoryId: 3,
    image: '/images/news3.jpg',
    author: '教务处',
    date: '2024-03-13',
    views: 756
  },
  {
    id: 4,
    title: '校园文化艺术节盛大开幕',
    summary: '春风拂面，艺彩纷呈。3月12日晚，我校第二十届校园文化艺术节开幕式晚会在体育馆隆重举行...',
    content: '春风拂面，艺彩纷呈。3月12日晚，我校第二十届校园文化艺术节开幕式晚会在体育馆隆重举行。校领导、各学院师生代表三千余人共同观看演出。本届艺术节以"青春筑梦·艺海扬帆"为主题，历时一个月，将举办歌手大赛、舞蹈比赛、书画展、摄影展等50余场活动。晚会现场气氛热烈，精彩的节目展现了当代大学生的精神风貌和艺术才华，赢得观众阵阵掌声。',
    category: '媒体地大',
    categoryId: 4,
    image: '/images/news4.jpg',
    author: '团委',
    date: '2024-03-12',
    views: 1532
  },

  {
    id: 6,
    title: '学校新增3个一级学科博士点',
    summary: '国务院学位委员会近日公布了2024年学位授权审核结果，我校新增3个一级学科博士点...',
    content: '国务院学位委员会近日公布了2024年学位授权审核结果，我校新增3个一级学科博士点。截至目前，学校拥有一级学科博士点达到12个，学科布局更加完善。本次新增的博士点涵盖计算机科学与技术、材料科学与工程、管理科学与工程等热门学科，将为学校"双一流"建设提供有力支撑。学校将继续加强学科建设，提升学科竞争力和影响力。',
    category: '立德树人',
    categoryId: 1,
    image: '/images/news6.jpg',
    author: '研究生院',
    date: '2024-03-08',
    views: 1123
  },
  {
    id: 7,
    title: '我校学生在国际数学建模竞赛中获佳绩',
    summary: '近日，2024年国际大学生数学建模竞赛成绩揭晓，我校参赛队伍共获得一等奖2项、二等奖5项...',
    content: '近日，2024年国际大学生数学建模竞赛成绩揭晓，我校参赛队伍共获得一等奖2项、二等奖5项、三等奖8项，获奖数量和层次均创历史新高。本次竞赛共有来自全球各高校的上万支队伍参加，竞争十分激烈。我校参赛学生克服时间紧、任务重等困难，团结协作、奋力拼搏，展现了扎实的专业素养和创新能力。学校将总结经验，继续支持学生参加各类学科竞赛。',
    category: '科技创新',
    categoryId: 2,
    image: '/images/news7.jpg',
    author: '理学院',
    date: '2024-03-06',
    views: 678
  },
  {
    id: 8,
    title: '图书馆开展数字资源使用培训',
    summary: '为帮助师生更好地利用图书馆数字资源，提升信息素养，图书馆将于3月份举办系列培训讲座...',
    content: '为帮助师生更好地利用图书馆数字资源，提升信息素养，图书馆将于3月份举办系列培训讲座。培训内容包括：CNKI中国知网使用技巧、Web of Science数据库检索方法、EndNote文献管理工具应用等。培训采用线上线下相结合的方式，方便师生灵活安排时间。图书馆还设置了咨询台，为师生提供一对一指导服务。欢迎广大师生积极参与。',
    category: '学术动态',
    categoryId: 3,
    image: '/images/news8.jpg',
    author: '图书馆',
    date: '2024-03-05',
    views: 445
  }
];

// ==================== 初始讲座数据 ====================
const defaultLectureData = [
  {
    id: 1,
    title: '【珞珈讲坛第537讲】国际海洋法法庭及其对国际法解释和发展的贡献',
    speaker: 'Tomas Heidar',
    speakerTitle: '',
    location: '武汉大学樱顶老图书馆',
    start_time: '2026-05-19 15:00',
    image: '/images/lecture_default.jpg',
    content: '点击下方链接查看详情',
    organizer: '武汉大学',
    category: '学术讲座',
    isFree: true,
    link: 'https://www.whu.edu.cn/info/5231/268554.htm'
  },
  {
    id: 2,
    title: '【通识大讲堂第73讲】长江文化：中华文明的命脉与根基',
    speaker: '刘汉俊',
    speakerTitle: '',
    location: '武汉大学图书馆总馆学术报告厅',
    start_time: '2026-05-21 19:00',
    image: '/images/lecture_default.jpg',
    content: '点击下方链接查看详情',
    organizer: '武汉大学',
    category: '学术讲座',
    isFree: true,
    link: 'https://mp.weixin.qq.com/s/_Jl1WrvVBnpPEmsRGU2kXw'
  },
  {
    id: 3,
    title: '【应用微观系列讲座第2期】AI 时代的研究范式：从模型能力到工作流设计',
    speaker: '陶学臻',
    speakerTitle: '上海财经大学商学院副教授',
    location: '华中科技大学经济学院402室',
    start_time: '2026-06-02 10:30',
    image: '/images/lecture_default.jpg',
    content: '点击下方链接查看详情',
    organizer: '华中科技大学巴西经济发展研究中心',
    category: '学术讲座',
    isFree: true,
    link: 'https://eco.hust.edu.cn/info/1040/13040.htm'
  },
  {
    id: 4,
    title: '【应用微观系列讲座第3期】Surgical Robots Help Females Break the Career Glass Ceiling: Evidence from da Vinci Adoption',
    speaker: '潘聿航',
    speakerTitle: '北京大学全球健康发展研究院',
    location: '华中科技大学经济学院402室',
    start_time: '2026-06-03 16:00',
    image: '/images/lecture_default.jpg',
    content: '点击下方链接查看详情',
    organizer: '华中科技大学巴西经济发展研究中心',
    category: '学术讲座',
    isFree: true,
    link: 'https://eco.hust.edu.cn/info/1040/13039.htm'
  },
  {
    id: 5,
    title: '第四届可持续出版论坛暨第一届出版科学研讨会',
    speaker: '多位全球学术出版专业人士',
    speakerTitle: '',
    location: '华中科技大学出版社',
    start_time: '2026-05-30 09:00',
    image: '/images/lecture_default.jpg',
    content: '点击下方链接查看详情',
    organizer: 'MDPI、华中科技大学出版社、湖北省高校期刊研究会',
    category: '学术交流',
    isFree: true,
    link: 'https://sciforum.net/event/SPF2026'
  },
  {
    id: 6,
    title: '【武汉"名家论坛"】是"竞争者"还是"好搭档"——人形机器人发展现状与未来展望',
    speaker: '曾祥瑞',
    speakerTitle: '',
    location: '武汉图书馆报告厅',
    start_time: '2026-05-23 14:30',
    image: '/images/lecture_default.jpg',
    content: '点击下方链接查看详情',
    organizer: '武汉图书馆',
    category: '学术讲座',
    isFree: true,
    link: 'https://mp.weixin.qq.com/s/yOlziX6zupYpZf-Pw5gVpA'
  },
  {
    id: 7,
    title: '【武汉"名家论坛"】从《武汉记忆：人文讲演录》谈城市文化普及与创新',
    speaker: '张笃勤',
    speakerTitle: '',
    location: '武汉图书馆报告厅',
    start_time: '2026-05-30 14:30',
    image: '/images/lecture_default.jpg',
    content: '点击下方链接查看详情',
    organizer: '武汉图书馆',
    category: '学术讲座',
    isFree: true,
    link: 'https://mp.weixin.qq.com/s/yOlziX6zupYpZf-Pw5gVpA'
  }
];

const categoryData = [
  { id: 1, name: '立德树人', icon: 'news' },
  { id: 2, name: '科技创新', icon: 'science' },
  { id: 3, name: '学术动态', icon: 'teaching' },
  { id: 4, name: '媒体地大', icon: 'culture' }
];

const bannerData = [
  { id: 1, newsId: 4, image: '/images/banner1.jpg', title: '校园文化艺术节盛大开幕' },
  { id: 2, newsId: 2, image: '/images/banner2.jpg', title: '我校获批国家级科研项目再创新高' },
  { id: 3, newsId: 6, image: '/images/banner3.jpg', title: '学校新增3个一级学科博士点' }
];

// ==================== 新闻数据 CRUD ====================

/**
 * 获取所有新闻（优先从 Storage 读取，否则用默认数据初始化）
 */
function _getAllNews() {
  let list = wx.getStorageSync(STORAGE_KEY_NEWS);
  if (!list || list.length === 0) {
    list = defaultNewsData;
    wx.setStorageSync(STORAGE_KEY_NEWS, list);
  }
  return list;
}

function _saveAllNews(list) {
  wx.setStorageSync(STORAGE_KEY_NEWS, list);
}

function getNewsList(categoryId) {
  const list = _getAllNews();
  const now = new Date();
  
  // 过滤出已到发布时间的新闻
  const filteredList = list.filter(item => {
    // 如果不是定时发布，或者定时发布且已到发布时间
    if (!item.isTimed) {
      return true;
    }
    if (item.date && item.publishTime) {
      const publishDateTime = new Date(`${item.date} ${item.publishTime}`);
      return publishDateTime <= now;
    }
    return true;
  });
  
  if (categoryId) {
    return filteredList.filter(item => item.categoryId === categoryId);
  }
  return filteredList;
}

/**
 * 获取所有新闻（包括未到发布时间的），用于管理员管理
 */
function getAllNewsList() {
  return _getAllNews();
}

function getNewsById(id) {
  const list = _getAllNews();
  const news = list.find(item => item.id === id);
  
  // 检查是否是定时发布且未到发布时间
  if (news && news.isTimed && news.date && news.publishTime) {
    const now = new Date();
    const publishDateTime = new Date(`${news.date} ${news.publishTime}`);
    if (publishDateTime > now) {
      return null;
    }
  }
  
  return news || null;
}

/**
 * 根据ID获取新闻（包括未到发布时间的），用于管理员编辑
 */
function getNewsByIdForAdmin(id) {
  const list = _getAllNews();
  return list.find(item => item.id === id) || null;
}

function getLatestNews(count) {
  count = count || 5;
  const list = _getAllNews();
  const now = new Date();
  
  // 过滤出已到发布时间的新闻
  const filteredList = list.filter(item => {
    if (!item.isTimed) {
      return true;
    }
    if (item.date && item.publishTime) {
      const publishDateTime = new Date(`${item.date} ${item.publishTime}`);
      return publishDateTime <= now;
    }
    return true;
  });
  
  return filteredList.slice(0, count);
}

/**
 * 新增新闻，自动生成 id
 */
function addNews(newsItem) {
  const list = _getAllNews();
  const maxId = list.reduce(function(max, item) { return item.id > max ? item.id : max; }, 0);
  newsItem.id = maxId + 1;
  newsItem.views = newsItem.views || 0;
  list.unshift(newsItem);
  _saveAllNews(list);
  return newsItem;
}

/**
 * 更新新闻
 */
function updateNews(newsItem) {
  const list = _getAllNews();
  const index = list.findIndex(item => item.id === newsItem.id);
  if (index !== -1) {
    list[index] = Object.assign({}, list[index], newsItem);
    _saveAllNews(list);
    return true;
  }
  return false;
}

/**
 * 删除新闻
 */
function deleteNews(id) {
  let list = _getAllNews();
  const before = list.length;
  list = list.filter(item => item.id !== id);
  if (list.length < before) {
    _saveAllNews(list);
    return true;
  }
  return false;
}

// ==================== 讲座数据 CRUD ====================

function _getAllLectures() {
  let list = wx.getStorageSync(STORAGE_KEY_LECTURES);
  if (!list || list.length === 0) {
    list = defaultLectureData;
    wx.setStorageSync(STORAGE_KEY_LECTURES, list);
  }
  return list;
}

function _saveAllLectures(list) {
  wx.setStorageSync(STORAGE_KEY_LECTURES, list);
}

function getLectureList() {
  return _getAllLectures();
}

function getLectureById(id) {
  const list = _getAllLectures();
  return list.find(item => item.id === id) || null;
}

/**
 * 新增讲座
 */
function addLecture(lectureItem) {
  const list = _getAllLectures();
  const maxId = list.reduce(function(max, item) { return item.id > max ? item.id : max; }, 0);
  lectureItem.id = maxId + 1;
  list.unshift(lectureItem);
  _saveAllLectures(list);
  return lectureItem;
}

/**
 * 更新讲座
 */
function updateLecture(lectureItem) {
  const list = _getAllLectures();
  const index = list.findIndex(item => item.id === lectureItem.id);
  if (index !== -1) {
    list[index] = Object.assign({}, list[index], lectureItem);
    _saveAllLectures(list);
    return true;
  }
  return false;
}

/**
 * 删除讲座
 */
function deleteLecture(id) {
  let list = _getAllLectures();
  const before = list.length;
  list = list.filter(item => item.id !== id);
  if (list.length < before) {
    _saveAllLectures(list);
    return true;
  }
  return false;
}

// ==================== 分类 & 轮播 ====================

function getCategoryList() {
  return categoryData;
}

function getBannerList() {
  return bannerData;
}

module.exports = {
  // 新闻
  getNewsList,
  getAllNewsList,
  getNewsById,
  getNewsByIdForAdmin,
  getLatestNews,
  addNews,
  updateNews,
  deleteNews,
  // 讲座
  getLectureList,
  getLectureById,
  addLecture,
  updateLecture,
  deleteLecture,
  // 分类 & 轮播
  getCategoryList,
  getBannerList,
  // 原始数据（兼容旧引用）
  newsData: defaultNewsData,
  lectureData: defaultLectureData,
  categoryData,
  bannerData
};
