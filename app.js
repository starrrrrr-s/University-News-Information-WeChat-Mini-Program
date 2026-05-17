App({
  globalData: {
    userInfo: null,
    isAdmin: false,
    themeConfig: null
  },

  onLaunch() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isAdmin = userInfo.isAdmin || false;
    }
    
    // 优先使用缓存的主题配置
    const cachedConfig = wx.getStorageSync('themeConfig');
    if (cachedConfig) {
      this.globalData.themeConfig = cachedConfig;
      // 立即应用主题配置，避免页面跳转时闪烁
      this.applyThemeConfig(cachedConfig);
    }
    
    // 后台加载最新配置
    this.loadThemeConfigInBackground();
  },

  onShow() {
    // 每次小程序显示时都应用缓存的主题配置
    const cachedConfig = wx.getStorageSync('themeConfig');
    if (cachedConfig) {
      this.globalData.themeConfig = cachedConfig;
      this.applyThemeConfig(cachedConfig);
    }
  },

  getThemeColor() {
    const config = this.globalData.themeConfig || wx.getStorageSync('themeConfig');
    return config ? config.primaryColor : '#1AAD19';
  },

  loadThemeConfigInBackground() {
    wx.request({
      url: 'http://localhost:3001/api/config/theme',
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          const themeConfig = res.data.data;
          const cachedConfig = wx.getStorageSync('themeConfig');
          const hasChanges = !cachedConfig || JSON.stringify(cachedConfig) !== JSON.stringify(themeConfig);

          if (hasChanges) {
            this.globalData.themeConfig = themeConfig;
            wx.setStorageSync('themeConfig', themeConfig);
          }
          // 无论是否有变化，都要应用主题配置
          this.applyThemeConfig(themeConfig);
        }
      }
    });
  },

  loadThemeConfig() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:3001/api/config/theme',
        method: 'GET',
        success: (res) => {
          if (res.data && res.data.success) {
            const themeConfig = res.data.data;
            this.globalData.themeConfig = themeConfig;
            wx.setStorageSync('themeConfig', themeConfig);
            this.applyThemeConfig(themeConfig);
            resolve(themeConfig);
          } else {
            reject(new Error('获取主题配置失败'));
          }
        },
        fail: () => {
          reject(new Error('网络请求失败'));
        }
      });
    });
  },

  applyThemeConfig(config) {
    if (!config) return;

    const primaryColor = config.primaryColor || '#1AAD19';
    const selectedColor = config.tabBarSelectedColor || primaryColor;

    // 应用导航栏颜色，使用白色字体
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: primaryColor,
      success: () => {},
      fail: () => {}
    });

    // 应用 TabBar 颜色
    wx.setTabBarStyle({
      color: '#999999',
      selectedColor: selectedColor,
      backgroundColor: '#ffffff',
      success: () => {},
      fail: () => {}
    });
  },

  setAdminMode(isAdmin) {
    const userInfo = this.globalData.userInfo;
    if (userInfo) {
      userInfo.isAdmin = isAdmin;
      this.globalData.isAdmin = isAdmin;
      wx.setStorageSync('userInfo', userInfo);
    }
  }
});