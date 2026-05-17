const app = getApp();

Page({
  data: {},

  onLoad() {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    wx.setNavigationBarTitle({ title: '关于我们' });
  }
});
