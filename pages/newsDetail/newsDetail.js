const data = require('../../utils/data.js');
const util = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    news: null,
    isCollected: false,
    isLoggedIn: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadNews(parseInt(options.id));
    }
  },

  onShow() {
    const userInfo = app.globalData.userInfo;
    this.setData({ isLoggedIn: !!userInfo });
    if (this.data.news) {
      this.checkCollectStatus(this.data.news.id);
    }
  },

  loadNews(id) {
    const news = data.getNewsById(id);
    if (news) {
      const newsWithColor = {
        ...news,
        categoryColor: util.getCategoryColor(news.categoryId)
      };
      this.setData({ news: newsWithColor });
      this.checkCollectStatus(news.id);
      wx.setNavigationBarTitle({ title: news.title });
    } else {
      wx.showToast({ title: '新闻不存在', icon: 'none' });
    }
  },

  checkCollectStatus(newsId) {
    const isLoggedIn = !!app.globalData.userInfo;
    if (isLoggedIn) {
      const isCollected = util.isNewsCollected(newsId);
      this.setData({ isCollected });
    } else {
      this.setData({ isCollected: false });
    }
  },

  onToggleCollect() {
    const news = this.data.news;
    if (!news) return;

    // 未登录时提示登录
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再收藏',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/personal/personal' });
          }
        }
      });
      return;
    }

    if (this.data.isCollected) {
      util.removeFromCollection(news.id);
      this.setData({ isCollected: false });
      wx.showToast({ title: '已取消收藏', icon: 'success' });
    } else {
      const newsToSave = {
        id: news.id,
        title: news.title,
        summary: news.summary,
        category: news.category,
        categoryId: news.categoryId,
        image: news.image,
        date: news.date
      };
      util.addToCollection(newsToSave);
      this.setData({ isCollected: true });
      wx.showToast({ title: '收藏成功', icon: 'success' });
    }
  },

  // 微信分享
  onShareAppMessage() {
    const news = this.data.news;
    return {
      title: news ? news.title : '高校新闻资讯',
      path: news ? '/pages/newsDetail/newsDetail?id=' + news.id : '/pages/index/index'
    };
  }
});
