const data = require('../../../utils/data.js');
const app = getApp();

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    lectureList: []
  },

  onLoad() {
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.loadLectures();
  },

  onShow() {
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.loadLectures();
  },

  loadLectures() {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: `${BASE_URL}/api/lectures`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          this.setData({ lectureList: res.data.data || [] });
        } else {
          const lectures = data.getLectureList();
          this.setData({ lectureList: lectures });
        }
      },
      fail: () => {
        const lectures = data.getLectureList();
        this.setData({ lectureList: lectures });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
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
          const token = wx.getStorageSync('token');
          wx.showLoading({ title: '删除中...' });
          wx.request({
            url: `${BASE_URL}/api/lectures/${id}`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${token}`
            },
            success: (res) => {
              if (res.data && res.data.success) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                this.loadLectures();
              } else {
                wx.showToast({ title: res.data.message || '删除失败', icon: 'none' });
              }
            },
            fail: () => {
              const success = data.deleteLecture(id);
              if (success) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                this.loadLectures();
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' });
              }
            },
            complete: () => {
              wx.hideLoading();
            }
          });
        }
      }
    });
  }
});
