const util = require('../../../utils/util.js');
const app = getApp();

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    newsList: [],
    isLoading: false
  },

  onLoad() {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.loadNews();
  },

  onShow() {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.loadNews();
  },

  loadNews() {
    this.setData({ isLoading: true });
    wx.request({
      url: `${BASE_URL}/api/news`,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const newsList = res.data.data.list || res.data.data;
          const newsWithColor = newsList.map(item => ({
            ...item,
            categoryColor: util.getCategoryColor(item.categoryId)
          }));
          this.setData({ newsList: newsWithColor });
        } else {
          wx.showToast({ title: '获取新闻列表失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  onAddNews() {
    wx.navigateTo({
      url: '/pages/admin/newsEdit/newsEdit'
    });
  },

  onEditNews(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/admin/newsEdit/newsEdit?id=' + id
    });
  },

  onDeleteNews(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    wx.showModal({
      title: '提示',
      content: '确定要删除这条新闻吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${BASE_URL}/api/news/${id}`,
            method: 'DELETE',
            header: {
              'Authorization': 'Bearer ' + wx.getStorageSync('token')
            },
            success: (res) => {
              if (res.data && res.data.success) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                this.loadNews();
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: '网络请求失败', icon: 'none' });
            }
          });
        }
      }
    });
  }
});
