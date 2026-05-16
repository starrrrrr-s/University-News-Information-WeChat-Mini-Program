const util = require('../../utils/util.js');

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    bannerList: [],
    latestNews: [],
    isRefreshing: false,
    lastRefreshTime: '',

    searchKeyword: '',
    searchMode: 'keyword',
    searchDate: '',
    searchYear: '',
    searchMonth: '',
    showSearchResults: false,
    searchResults: [],
    searchTotal: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    isSearching: false,
    showYearPicker: false,
    yearList: [],
    hoverYear: ''
  },

  onLoad() {
    this.loadBanner();
    this.loadLatestNews();
    this.initYearList();
  },

  initYearList() {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 2020; i <= currentYear + 5; i++) {
      years.push(i.toString());
    }
    this.setData({ yearList: years });
  },

  onShow() {
    this.loadBanner();
    this.loadLatestNews();
  },

  onPullDownRefresh() {
    this.setData({ isRefreshing: true });
    this.loadBanner();
    this.loadLatestNews();

    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;

    setTimeout(() => {
      wx.stopPullDownRefresh();
      this.setData({ isRefreshing: false, lastRefreshTime: timeStr });
      wx.showToast({ title: '已刷新', icon: 'success', duration: 1000 });
    }, 600);
  },

  loadBanner() {
    wx.request({
      url: `${BASE_URL}/api/news/latest`,
      method: 'GET',
      data: { limit: 3 },
      success: (res) => {
        if (res.data && res.data.success) {
          const banners = res.data.data.map((item, index) => ({
            id: index + 1,
            newsId: item.id,
            image: item.image,
            title: item.title
          }));
          this.setData({ bannerList: banners });
        }
      },
      fail: () => {
        console.log('获取轮播图失败');
      }
    });
  },

  loadLatestNews() {
    wx.request({
      url: `${BASE_URL}/api/news/latest`,
      method: 'GET',
      data: { limit: 5 },
      success: (res) => {
        if (res.data && res.data.success) {
          const newsList = res.data.data.map(item => ({
            ...item,
            categoryColor: util.getCategoryColor(item.categoryId)
          }));
          this.setData({ latestNews: newsList });
        }
      },
      fail: () => {
        console.log('获取最新新闻失败');
      }
    });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });

    if (keyword.trim()) {
      this.setData({ showSearchResults: true, currentPage: 1 });
      this.performSearch(keyword);
    } else {
      this.setData({ showSearchResults: false, searchResults: [], searchTotal: 0 });
    }
  },

  onSearchSubmit() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) return;

    this.setData({ showSearchResults: true, currentPage: 1 });
    this.performSearch(keyword);
  },

  toggleSearchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      searchMode: mode,
      showSearchResults: false,
      searchResults: [],
      searchTotal: 0
    });

    if (mode === 'keyword' && this.data.searchKeyword.trim()) {
      this.performSearch(this.data.searchKeyword);
    } else if (mode === 'year' && this.data.searchYear) {
      this.setData({ showSearchResults: true, currentPage: 1 });
      this.performDateSearch();
    } else if (mode === 'month' && this.data.searchMonth) {
      this.setData({ showSearchResults: true, currentPage: 1 });
      this.performDateSearch();
    } else if (mode === 'day' && this.data.searchDate) {
      this.setData({ showSearchResults: true, currentPage: 1 });
      this.performDateSearch();
    }
  },

  onYearPickerTap() {
    if (!this.data.searchYear) {
      const currentYear = new Date().getFullYear().toString();
      this.setData({ searchYear: currentYear });
    }
    this.setData({ showYearPicker: true });
  },

  onYearPickerClose() {
    this.setData({ showYearPicker: false });
  },

  stopPropagation() {
  },

  onYearMouseEnter(e) {
    const year = e.currentTarget.dataset.year;
    this.setData({ hoverYear: year });
  },

  onYearMouseLeave() {
    this.setData({ hoverYear: '' });
  },

  onYearSelect(e) {
    const year = e.currentTarget.dataset.year;
    this.setData({
      searchYear: year,
      showSearchResults: true,
      currentPage: 1,
      showYearPicker: false
    });
    this.performDateSearch();
  },

  onMonthSelect(e) {
    const date = e.detail.value;
    const year = date.split('-')[0];
    const month = date.split('-')[1];
    this.setData({
      searchMonth: year + '-' + month,
      showSearchResults: true,
      currentPage: 1
    });
    this.performDateSearch();
  },

  onDaySelect(e) {
    const date = e.detail.value;
    this.setData({
      searchDate: date,
      showSearchResults: true,
      currentPage: 1
    });
    this.performDateSearch();
  },

  performSearch(keyword) {
    this.setData({ isSearching: true });

    wx.request({
      url: `${BASE_URL}/api/news/search`,
      method: 'GET',
      data: {
        keyword,
        page: this.data.currentPage,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const results = res.data.data.map(item => {
            const matchCount = this.countMatches(item.title, item.summary || '', keyword);
            return {
              ...item,
              categoryColor: util.getCategoryColor(item.categoryId),
              matchCount
            };
          }).sort((a, b) => b.matchCount - a.matchCount);

          const total = res.data.pagination ? res.data.pagination.total : results.length;
          const totalPages = Math.ceil(total / this.data.pageSize);

          this.setData({
            searchResults: results,
            searchTotal: total,
            totalPages: totalPages || 1,
            isSearching: false
          });
        } else {
          this.setData({ searchResults: [], searchTotal: 0, totalPages: 0, isSearching: false });
        }
      },
      fail: () => {
        this.setData({ searchResults: [], searchTotal: 0, totalPages: 0, isSearching: false });
      }
    });
  },

  performDateSearch() {
    this.setData({ isSearching: true });

    let keyword = '';
    if (this.data.searchMode === 'day' && this.data.searchDate) {
      keyword = this.data.searchDate;
    } else if (this.data.searchMode === 'month' && this.data.searchMonth) {
      keyword = this.data.searchMonth;
    } else if (this.data.searchMode === 'year' && this.data.searchYear) {
      keyword = this.data.searchYear;
    }

    if (!keyword) {
      this.setData({ searchResults: [], searchTotal: 0, totalPages: 0, isSearching: false });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/news/search`,
      method: 'GET',
      data: {
        keyword: keyword,
        page: this.data.currentPage,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const results = res.data.data.map(item => ({
            ...item,
            categoryColor: util.getCategoryColor(item.categoryId)
          }));

          const total = res.data.pagination ? res.data.pagination.total : results.length;
          const totalPages = Math.ceil(total / this.data.pageSize);

          this.setData({
            searchResults: results,
            searchTotal: total,
            totalPages: totalPages || 1,
            isSearching: false
          });
        } else {
          this.setData({ searchResults: [], searchTotal: 0, totalPages: 0, isSearching: false });
        }
      },
      fail: () => {
        this.setData({ searchResults: [], searchTotal: 0, totalPages: 0, isSearching: false });
      }
    });
  },

  countMatches(title, summary, keyword) {
    let count = 0;
    const regex = new RegExp(keyword, 'gi');
    count += (title.match(regex) || []).length;
    count += (summary.match(regex) || []).length;
    return count;
  },

  onPrevPage() {
    if (this.data.currentPage <= 1) return;
    const newPage = this.data.currentPage - 1;
    this.setData({ currentPage: newPage });

    if (this.data.searchMode === 'keyword' && this.data.searchKeyword) {
      this.performSearch(this.data.searchKeyword);
    } else if (this.data.searchMode === 'year' || this.data.searchMode === 'month' || this.data.searchMode === 'day') {
      this.performDateSearch();
    }
  },

  onNextPage() {
    if (this.data.currentPage >= this.data.totalPages) return;
    const newPage = this.data.currentPage + 1;
    this.setData({ currentPage: newPage });

    if (this.data.searchMode === 'keyword' && this.data.searchKeyword) {
      this.performSearch(this.data.searchKeyword);
    } else if (this.data.searchMode === 'year' || this.data.searchMode === 'month' || this.data.searchMode === 'day') {
      this.performDateSearch();
    }
  },

  onClearSearch() {
    this.setData({ searchKeyword: '', searchResults: [], searchTotal: 0, showSearchResults: false });
  },

  onNewsTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/newsDetail/newsDetail?id=${id}`
    });
  },

  onSearchResultTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/newsDetail/newsDetail?id=${id}`
    });
  },

  onBannerTap(e) {
    const id = e.currentTarget.dataset.newsId;
    wx.navigateTo({
      url: `/pages/newsDetail/newsDetail?id=${id}`
    });
  },

  onMoreNews() {
    wx.switchTab({
      url: '/pages/news/news'
    });
  }
});
