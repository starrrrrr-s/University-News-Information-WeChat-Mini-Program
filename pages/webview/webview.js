Page({
  data: {
    url: ''
  },

  onLoad(options) {
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
