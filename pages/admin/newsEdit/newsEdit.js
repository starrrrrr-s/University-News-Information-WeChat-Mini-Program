const util = require('../../../utils/util.js');
const data = require('../../../utils/data.js');
const app = getApp();

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    newsId: null,
    isEdit: false,
    title: '',
    categoryId: 1,
    selectedCategoryIndex: 0,
    author: '',
    date: '',
    summary: '',
    content: '',
    sourceUrl: '',
    imageUrl: '',
    categoryList: [],
    isTimedPublish: false,
    publishTime: '',
    publishDate: ''
  },

  onLoad(options) {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.newsId = options.id || null;
    if (this.newsId) {
      this.setData({ isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑新闻' });
    } else {
      wx.setNavigationBarTitle({ title: '添加新闻' });
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const h = String(today.getHours()).padStart(2, '0');
      const minute = String(today.getMinutes()).padStart(2, '0');
      this.setData({ 
        date: `${y}-${m}-${d}`,
        publishDate: `${y}-${m}-${d}`,
        publishTime: `${h}:${minute}`
      });
    }
    this.loadCategories();
  },

  loadCategories() {
    wx.request({
      url: `${BASE_URL}/api/categories`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          this.setData({ categoryList: res.data.data });
        } else {
          this.setData({ categoryList: data.getCategoryList() });
        }
        if (this.newsId) {
          this.loadNews(this.newsId);
        }
      },
      fail: () => {
        this.setData({ categoryList: data.getCategoryList() });
        if (this.newsId) {
          this.loadNews(this.newsId);
        }
      }
    });
  },

  loadNews(id) {
    wx.request({
      url: `${BASE_URL}/api/news/${id}`,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const news = res.data.data;
          const categories = this.data.categoryList;
          const idx = categories.findIndex(c => c.id === news.categoryId);
          
          let publishTime = '';
          if (news.published_at) {
            const pubDate = new Date(news.published_at);
            publishTime = `${String(pubDate.getHours()).padStart(2, '0')}:${String(pubDate.getMinutes()).padStart(2, '0')}`;
          }
          
          this.setData({
            newsId: news.id,
            title: news.title,
            categoryId: news.categoryId,
            selectedCategoryIndex: idx >= 0 ? idx : 0,
            author: news.author,
            date: news.date,
            summary: news.summary,
            content: news.content,
            sourceUrl: news.source_url || '',
            imageUrl: news.image_url || '',
            isTimedPublish: news.isTimed || false,
            publishDate: news.date || '',
            publishTime: publishTime
          });
        } else {
          wx.showToast({ title: '获取新闻详情失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onCategoryChange(e) {
    const index = parseInt(e.detail.value);
    const category = this.data.categoryList[index];
    this.setData({
      selectedCategoryIndex: index,
      categoryId: category.id
    });
  },

  onAuthorInput(e) {
    this.setData({ author: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onSummaryInput(e) {
    this.setData({ summary: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onSourceUrlInput(e) {
    this.setData({ sourceUrl: e.detail.value });
  },

  onImageUrlInput(e) {
    this.setData({ imageUrl: e.detail.value });
  },

  onTimedPublishChange(e) {
    this.setData({ isTimedPublish: e.detail.value });
  },

  onPublishDateChange(e) {
    this.setData({ publishDate: e.detail.value });
  },

  onPublishTimeChange(e) {
    this.setData({ publishTime: e.detail.value });
  },

  onSave() {
    const { title, categoryId, author, date, summary, content, sourceUrl, imageUrl, isTimedPublish, publishDate, publishTime } = this.data;

    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!author.trim()) {
      wx.showToast({ title: '请输入作者', icon: 'none' });
      return;
    }
    if (!date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    if (isTimedPublish && (!publishDate || !publishTime)) {
      wx.showToast({ title: '请选择定时发布时间', icon: 'none' });
      return;
    }
    if (!summary.trim()) {
      wx.showToast({ title: '请输入摘要', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    const newsItem = {
      title: title.trim(),
      category_id: categoryId,
      author: author.trim(),
      summary: summary.trim(),
      content: content.trim(),
      source_url: sourceUrl.trim(),
      image_url: imageUrl.trim(),
      published_at: isTimedPublish ? `${publishDate} ${publishTime}` : date
    };

    const url = this.data.isEdit ? `${BASE_URL}/api/news/${this.data.newsId}` : `${BASE_URL}/api/news`;
    const method = this.data.isEdit ? 'PUT' : 'POST';

    wx.request({
      url: url,
      method: method,
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token'),
        'Content-Type': 'application/json'
      },
      data: newsItem,
      success: (res) => {
        if (res.data && res.data.success) {
          const msg = this.data.isEdit ? '更新成功' : (isTimedPublish ? '定时发布设置成功' : '添加成功');
          wx.showToast({ title: msg, icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: this.data.isEdit ? '更新失败' : '添加失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  }
});
