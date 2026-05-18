const app = getApp();

Page({
  data: {
    url: ''
  },

  onLoad(options) {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    if (options.url) {
      const url = decodeURIComponent(options.url);
      this.setData({ url });
      wx.setNavigationBarTitle({ title: '原文链接' });
    } else {
      wx.showToast({ title: '链接无效', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  }
});
