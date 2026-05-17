const data = require('../../utils/data.js');

const BASE_URL = 'http://localhost:3001';

const _themeColor = (wx.getStorageSync('themeConfig') || {}).primaryColor || '#1AAD19';

Page({
  data: {
    lectureList: [],
    lastRefreshTime: '',
    themeColor: _themeColor
  },

  onLoad() {
    // 立即应用缓存的主题颜色，避免页面跳转时闪烁
    const app = getApp();
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
      this.setData({ themeColor: themeConfig.primaryColor || '#1AAD19' });
    }
    this.loadLectures();
  },

  onShow() {
    const app = getApp();
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
      this.setData({ themeColor: themeConfig.primaryColor || '#1AAD19' });
    }
    this.loadLectures();
  },

  onPullDownRefresh() {
    this.loadLectures();

    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');

    setTimeout(() => {
      wx.stopPullDownRefresh();
      this.setData({ lastRefreshTime: `${h}:${m}:${s}` });
      wx.showToast({ title: '已刷新', icon: 'success', duration: 1000 });
    }, 600);
  },

  loadLectures() {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: `${BASE_URL}/api/lectures`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          const lectures = (res.data.data || []).map(item => ({
            ...item,
            time: item.start_time || item.time,
            isFree: item.is_free !== undefined ? item.is_free : true
          }));
          this.setData({ lectureList: lectures });
        } else {
          // 后端失败时使用本地数据
          const lectures = data.getLectureList();
          this.setData({ lectureList: lectures });
        }
      },
      fail: () => {
        // 后端不可用时使用本地数据
        const lectures = data.getLectureList();
        this.setData({ lectureList: lectures });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  onLectureTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/lectureDetail/lectureDetail?id=' + id });
  }
});
