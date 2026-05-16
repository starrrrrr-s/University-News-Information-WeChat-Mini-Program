const util = require('../../utils/util.js');

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    categoryList: [],
    newsList: [],
    currentCategory: 0,
    lastRefreshTime: '',
    page: 1,
    limit: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadCategories();
    this.loadNews();
  },

  onShow() {
    this.loadNews();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.loadCategories();
    this.loadNews(true);

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
    wx.request({
      url: `${BASE_URL}/api/categories`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          this.setData({ categoryList: res.data.data });
        }
      },
      fail: () => {
        console.log('获取分类失败，使用默认数据');
        this.setData({
          categoryList: [
            { id: 1, name: '立德树人' },
            { id: 2, name: '科技创新' },
            { id: 3, name: '学术动态' },
            { id: 4, name: '媒体地大' }
          ]
        });
      }
    });
  },

  loadNews(reset = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const page = reset ? 1 : this.data.page;
    const isLatest = this.data.currentCategory === 0;

    let url = isLatest ? `${BASE_URL}/api/news/latest` : `${BASE_URL}/api/news`;
    let data = {
      page,
      limit: this.data.limit
    };
    
    if (!isLatest) {
      data.category_id = this.data.currentCategory;
    }

    wx.request({
      url: url,
      method: 'GET',
      data: data,
      success: (res) => {
        if (res.data && res.data.success) {
          const newsWithColor = res.data.data.map(item => ({
            ...item,
            categoryColor: util.getCategoryColor(item.categoryId || item.category_id)
          }));

          const newsList = reset ? newsWithColor : [...this.data.newsList, ...newsWithColor];
          const pagination = res.data.pagination || {};
          const hasMore = page < pagination.pages;

          this.setData({
            newsList,
            page: page + 1,
            hasMore,
            loading: false
          });
        }
      },
      fail: () => {
        console.log('获取新闻失败');
        this.setData({ loading: false });
      }
    });
  },

  onTabChange(e) {
    const categoryId = parseInt(e.currentTarget.dataset.id);
    this.setData({ 
      currentCategory: categoryId, 
      page: 1, 
      hasMore: true, 
      newsList: [] 
    });
    this.loadNews(true);
  },

  onNewsTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/newsDetail/newsDetail?id=' + id });
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadNews();
    }
  }
});