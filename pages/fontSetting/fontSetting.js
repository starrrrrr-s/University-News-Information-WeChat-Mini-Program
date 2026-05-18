const app = getApp();

const DEFAULT_FONT_SIZE = 30;
const MIN_SIZE = 22;
const MAX_SIZE = 42;

Page({
  data: {
    fontSize: DEFAULT_FONT_SIZE,
    minSize: MIN_SIZE,
    maxSize: MAX_SIZE,
    fontSizeLabel: '标准'
  },

  onLoad() {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    wx.setNavigationBarTitle({ title: '字体设置' });
    const saved = wx.getStorageSync('fontSize');
    const fontSize = saved || DEFAULT_FONT_SIZE;
    this.setData({
      fontSize,
      fontSizeLabel: this.getSizeLabel(fontSize)
    });
  },

  /** 滑块拖动中（实时预览） */
  onSliderChanging(e) {
    const fontSize = e.detail.value;
    this.setData({
      fontSize,
      fontSizeLabel: this.getSizeLabel(fontSize)
    });
  },

  /** 滑块拖动结束（保存） */
  onSliderChange(e) {
    const fontSize = e.detail.value;
    this.setData({
      fontSize,
      fontSizeLabel: this.getSizeLabel(fontSize)
    });
    this.saveFontSize(fontSize);
  },

  /** 快捷选项 */
  onQuickSelect(e) {
    const fontSize = parseInt(e.currentTarget.dataset.size);
    this.setData({
      fontSize,
      fontSizeLabel: this.getSizeLabel(fontSize)
    });
    this.saveFontSize(fontSize);
  },

  /** 恢复默认 */
  onReset() {
    this.setData({
      fontSize: DEFAULT_FONT_SIZE,
      fontSizeLabel: this.getSizeLabel(DEFAULT_FONT_SIZE)
    });
    this.saveFontSize(DEFAULT_FONT_SIZE);
    wx.showToast({ title: '已恢复默认', icon: 'success' });
  },

  saveFontSize(fontSize) {
    wx.setStorageSync('fontSize', fontSize);
  },

  getSizeLabel(size) {
    if (size <= 24) return '小';
    if (size <= 30) return '标准';
    if (size <= 36) return '大';
    return '超大';
  }
});
