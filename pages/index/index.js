const data = require('../../utils/data.js');
const util = require('../../utils/util.js');

Page({
  data: {
    bannerList: [],
    latestNews: []
  },

  onLoad() {
    this.loadBanner();
    this.loadLatestNews();
  },

  onShow() {
    this.loadLatestNews();
  },

  loadBanner() {
    const banners = data.getBannerList();
    this.setData({
      bannerList: banners
    });
  },

  loadLatestNews() {
    const newsList = data.getLatestNews(5);
    const newsWithColor = newsList.map(item => ({
      ...item,
      categoryColor: util.getCategoryColor(item.categoryId)
    }));
    this.setData({
      latestNews: newsWithColor
    });
  },

  onBannerTap(e) {
    const id = e.currentTarget.dataset.id;
    const banner = this.data.bannerList.find(item => item.id === id);
    if (banner && banner.newsId) {
      wx.navigateTo({
        url: '/pages/newsDetail/newsDetail?id=' + banner.newsId
      });
    }
  },

  onNewsTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/newsDetail/newsDetail?id=' + id
    });
  },

  onMoreNews() {
    wx.switchTab({
      url: '/pages/news/news'
    });
  }
});