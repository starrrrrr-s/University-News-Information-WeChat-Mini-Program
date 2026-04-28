const data = require('../../utils/data.js');
const util = require('../../utils/util.js');

Page({
  data: {
    categoryList: [],
    newsList: [],
    currentCategory: 0
  },

  onLoad() {
    this.loadCategories();
    this.loadNews();
  },

  onShow() {
    this.loadNews();
  },

  loadCategories() {
    const categories = data.getCategoryList();
    this.setData({
      categoryList: categories
    });
  },

  loadNews() {
    const categoryId = this.data.currentCategory === 0 ? null : this.data.currentCategory;
    const newsList = data.getNewsList(categoryId);
    const newsWithColor = newsList.map(item => ({
      ...item,
      categoryColor: util.getCategoryColor(item.categoryId)
    }));
    this.setData({
      newsList: newsWithColor
    });
  },

  onTabChange(e) {
    const categoryId = parseInt(e.currentTarget.dataset.id);
    this.setData({
      currentCategory: categoryId
    });
    this.loadNews();
  },

  onNewsTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/newsDetail/newsDetail?id=' + id
    });
  }
});