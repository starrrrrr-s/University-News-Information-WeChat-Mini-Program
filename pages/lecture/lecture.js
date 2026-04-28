const data = require('../../utils/data.js');

Page({
  data: {
    lectureList: [],
    lastRefreshTime: ''
  },

  onLoad() {
    this.loadLectures();
  },

  onShow() {
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
    const lectures = data.getLectureList();
    this.setData({ lectureList: lectures });
  },

  onLectureTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/lectureDetail/lectureDetail?id=' + id });
  }
});
