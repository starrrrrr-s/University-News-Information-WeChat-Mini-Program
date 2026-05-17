const data = require('../../../utils/data.js');
const app = getApp();

Page({
  data: {
    lectureList: []
  },

  onLoad() {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.loadLectures();
  },

  onShow() {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.loadLectures();
  },

  loadLectures() {
    const lectures = data.getLectureList();
    this.setData({ lectureList: lectures });
  },

  onAddLecture() {
    wx.navigateTo({
      url: '/pages/admin/lectureEdit/lectureEdit'
    });
  },

  onEditLecture(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/admin/lectureEdit/lectureEdit?id=' + id
    });
  },

  onDeleteLecture(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    wx.showModal({
      title: '提示',
      content: '确定要删除这个讲座吗？',
      success: (res) => {
        if (res.confirm) {
          const success = data.deleteLecture(id);
          if (success) {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadLectures();
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
