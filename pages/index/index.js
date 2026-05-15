const util = require('../../utils/util.js');

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    bannerList: [],
    latestNews: [],
    isRefreshing: false,
    lastRefreshTime: ''
  },

  onLoad() {
    this.loadBanner();
    this.loadLatestNews();
  },

  onShow() {
    this.loadBanner();
    this.loadLatestNews();
  },

  onPullDownRefresh() {
    this.setData({ isRefreshing: true });
    this.loadBanner();
    this.loadLatestNews();

    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;

    setTimeout(() => {
      wx.stopPullDownRefresh();
      this.setData({ isRefreshing: false, lastRefreshTime: timeStr });
      wx.showToast({ title: '已刷新', icon: 'success', duration: 1000 });
    }, 600);
  },

  loadBanner() {
    wx.request({
      url: `${BASE_URL}/api/news/latest`,
      method: 'GET',
      data: { limit: 3 },
      success: (res) => {
        if (res.data && res.data.success) {
          const banners = res.data.data.map((item, index) => ({
            id: index + 1,
            newsId: item.id,
            image: item.image,
            title: item.title
          }));
          this.setData({ bannerList: banners });
        }
      },
      fail: () => {
        console.log('获取轮播图失败');
      }
    });
  },

  loadLatestNews() {
    wx.request({
      url: `${BASE_URL}/api/news/latest`,
      method: 'GET',
      data: { limit: 5 },
      success: (res) => {
        if (res.data && res.data.success) {
          const newsList = res.data.data.map(item => ({
            ...item,
            categoryColor: util.getCategoryColor(item.categoryId)
          }));
          this.setData({ latestNews: newsList });
        }
      },
      fail: () => {
        console.log('获取最新新闻失败');
      }
    });
  },

  onBannerTap(e) {
    const newsId = e.currentTarget.dataset.newsId;
    if (newsId) {
      wx.navigateTo({ url: '/pages/newsDetail/newsDetail?id=' + newsId });
    }
  },

  onNewsTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/newsDetail/newsDetail?id=' + id });
  },

  onMoreNews() {
    wx.switchTab({ url: '/pages/news/news' });
  }
});