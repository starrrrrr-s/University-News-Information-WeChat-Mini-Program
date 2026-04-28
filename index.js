const data = require('../../utils/data.js');
const util = require('../../utils/util.js');

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

  // 微信原生下拉刷新回调
  onPullDownRefresh() {
    this.setData({ isRefreshing: true });
    this.loadBanner();
    this.loadLatestNews();

    // 记录刷新时间
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;

    // 停止下拉动画，给用户明确的反馈
    setTimeout(() => {
      wx.stopPullDownRefresh();
      this.setData({ isRefreshing: false, lastRefreshTime: timeStr });
      wx.showToast({ title: '已刷新', icon: 'success', duration: 1000 });
    }, 600);
  },

  loadBanner() {
    const banners = data.getBannerList();
    this.setData({ bannerList: banners });
  },

  loadLatestNews() {
    // 按日期降序排列，确保最新内容优先展示
    const newsList = data.getLatestNews(5);
    const sorted = newsList.slice().sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    const newsWithColor = sorted.map(item => ({
      ...item,
      categoryColor: util.getCategoryColor(item.categoryId)
    }));
    this.setData({ latestNews: newsWithColor });
  },

  onBannerTap(e) {
    const id = e.currentTarget.dataset.id;
    const banner = this.data.bannerList.find(item => item.id === id);
    if (banner && banner.newsId) {
      wx.navigateTo({ url: '/pages/newsDetail/newsDetail?id=' + banner.newsId });
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
