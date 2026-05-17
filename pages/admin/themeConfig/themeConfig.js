const BASE_URL = 'http://localhost:3001';

const _themeColor = (wx.getStorageSync('themeConfig') || {}).primaryColor || '#1AAD19';

Page({
  data: {
    presetColors: [],
    currentColor: '#1AAD19',
    selectedColor: null,
    isLoading: false,
    themeColor: _themeColor
  },

  onLoad() {
    this.loadPresetColors();
  },

  onShow() {
    const app = getApp();
    const themeColor = app.getThemeColor();
    this.setData({ themeColor });
    app.applyThemeConfig(app.globalData.themeConfig || wx.getStorageSync('themeConfig'));
  },

  loadPresetColors() {
    this.setData({ isLoading: true });
    wx.request({
      url: `${BASE_URL}/api/config/theme/presets`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          this.setData({
            presetColors: res.data.data.presets,
            currentColor: res.data.data.currentColor,
            selectedColor: res.data.data.currentColor
          });
        } else {
          wx.showToast({ title: '获取颜色列表失败', icon: 'none' });
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

  selectColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ selectedColor: color });
  },

  applyColor() {
    const { selectedColor, currentColor } = this.data;

    if (!selectedColor) {
      wx.showToast({ title: '请选择颜色', icon: 'none' });
      return;
    }

    if (selectedColor === currentColor) {
      wx.showToast({ title: '该颜色已生效', icon: 'none' });
      return;
    }

    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/config/theme`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { color: selectedColor },
      success: (res) => {
        if (res.data && res.data.success) {
          this.setData({ currentColor: selectedColor });

          // 1. 立即更新 globalData 和缓存
          const app = getApp();
          const newConfig = {
            primaryColor: selectedColor,
            navigationBarBackgroundColor: selectedColor,
            tabBarSelectedColor: selectedColor
          };
          app.globalData.themeConfig = newConfig;
          app.globalData.themeColor = selectedColor;
          wx.setStorageSync('themeConfig', newConfig);

          // 2. 立即应用导航栏和 tabBar 颜色
          app.applyThemeConfig(newConfig);

          // 3. 通知所有已加载的页面立即更新 themeColor（包括本页）
          const pages = getCurrentPages();
          pages.forEach(page => {
            if (page.data && page.data.themeColor !== undefined) {
              page.setData({ themeColor: selectedColor });
            }
          });

          wx.showToast({ title: '主题已更新', icon: 'success' });

          // 4. 直接返回，不需要 reLaunch
          setTimeout(() => {
            wx.navigateBack();
          }, 800);
        } else {
          wx.showToast({ title: res.data.message || '应用失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  },

  resetToDefault() {
    this.setData({ selectedColor: '#1AAD19' });
  }
});