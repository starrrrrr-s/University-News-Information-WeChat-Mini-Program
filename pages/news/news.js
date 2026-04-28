const data = require('../../utils/data.js');
const util = require('../../utils/util.js');

Page({
  data: {
    categoryList: [],
    newsList: [],
    currentCategory: 0,
    lastRefreshTime: ''
  },

  onLoad() {
    this.loadCategories();
    this.loadNews();
  },

  onShow() {
    this.loadNews();
  },

  onPullDownRefresh() {
    this.loadCategories();
    this.loadNews();

    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');

    setTimeout(() => {
      wx.stopPullDownRefresh();
      this.setData({ lastRefreshTime: `${h}:${m}:${s}` });
      wx.showToast({ title: '已刷新', icon: 'success', duration: 1000 });
    }, 600);
  },

  loadCategories() {
    const categories = data.getCategoryList();
    this.setData({ categoryList: categories });
  },

  loadNews() {
    const categoryId = this.data.currentCategory === 0 ? null : this.data.currentCategory;
    const newsList = data.getNewsList(categoryId);
    const newsWithColor = newsList.map(item => ({
      ...item,
      categoryColor: util.getCategoryColor(item.categoryId)
    }));
    this.setData({ newsList: newsWithColor });
  },

  onTabChange(e) {
    const categoryId = parseInt(e.currentTarget.dataset.id);
    this.setData({ currentCategory: categoryId });
    this.loadNews();
  },

  onNewsTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/newsDetail/newsDetail?id=' + id });
  }
});
