const data = require('../../../utils/data.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    newsList: []
  },

  onLoad() {
    this.loadNews();
  },

  onShow() {
    this.loadNews();
  },

  loadNews() {
    const newsList = data.getAllNewsList();
    const newsWithColor = newsList.map(item => ({
      ...item,
      categoryColor: util.getCategoryColor(item.categoryId)
    }));
    this.setData({ newsList: newsWithColor });
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
          const success = data.deleteNews(id);
          if (success) {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadNews();
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
