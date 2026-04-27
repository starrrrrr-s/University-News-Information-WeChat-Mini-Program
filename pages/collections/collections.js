const util = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    collections: [],
    isLoggedIn: false
  },

  onLoad() {
    this.checkAndLoad();
  },

  onShow() {
    this.checkAndLoad();
  },

  checkAndLoad() {
    const userInfo = app.globalData.userInfo;
    const isLoggedIn = !!userInfo;
    this.setData({ isLoggedIn });

    if (isLoggedIn) {
      this.loadCollections();
    } else {
      // 未登录时清空展示
      this.setData({ collections: [] });
    }
  },

  loadCollections() {
    const collections = util.getCollections();
    const collectionsWithColor = collections.map(item => ({
      ...item,
      categoryColor: util.getCategoryColor(item.categoryId)
    }));
    this.setData({ collections: collectionsWithColor });
  },

  onNewsTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/newsDetail/newsDetail?id=' + id
    });
  },

  onGoLogin() {
    wx.switchTab({
      url: '/pages/personal/personal'
    });
  }
});
