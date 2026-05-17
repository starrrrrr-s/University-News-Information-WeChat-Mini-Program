const util = require('../../utils/util.js');

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    bannerList: [],
    latestNews: [],
    isRefreshing: false,
    lastRefreshTime: '',
    latestPage: 1,
    latestLimit: 10,
    latestHasMore: true,
    latestLoading: false,

    searchKeyword: '',
    searchMode: 'keyword',
    searchDate: '',
    searchYear: '',
    searchMonth: '',
    searchDay: '',
    monthText: '',
    dayText: '',
    showSearchResults: false,
    searchResults: [],
    searchTotal: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    isSearching: false,
    showYearPicker: false,
    showMonthPicker: false,
    showDayPicker: false,
    yearList: [],
    monthList: [],
    dayList: [],
    hoverYear: '',
    minYear: 2020
  },

  onLoad() {
    this.loadBanner();
    this.loadLatestNews(true);
    this.initYearList();
  },

  initYearList() {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = this.data.minYear; i <= currentYear; i++) {
      years.push(i.toString());
    }
    this.setData({ yearList: years });
  },

  initMonthList(year) {
    const months = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const maxMonth = (year == currentYear) ? currentMonth : 12;
    
    for (let i = 1; i <= maxMonth; i++) {
      months.push(i.toString().padStart(2, '0'));
    }
    this.setData({ monthList: months });
  },

  initDayList(year, month) {
    const days = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();
    
    let maxDay = new Date(year, month, 0).getDate();
    
    if (year == currentYear && month == currentMonth) {
      maxDay = currentDay;
    }
    
    for (let i = 1; i <= maxDay; i++) {
      days.push(i.toString().padStart(2, '0'));
    }
    this.setData({ dayList: days });
  },

  onShow() {
    this.loadBanner();
    this.loadLatestNews(true);
  },

  onPullDownRefresh() {
    this.setData({ isRefreshing: true });
    this.loadBanner();
    this.loadLatestNews(true);

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

  onReachBottom() {
    if (this.data.showSearchResults) return;
    if (this.data.latestHasMore && !this.data.latestLoading) {
      this.loadLatestNews(false);
    }
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

  loadLatestNews(reset = false) {
    if (this.data.latestLoading) return;
    if (!reset && !this.data.latestHasMore) return;

    const page = reset ? 1 : this.data.latestPage;
    this.setData({ latestLoading: true });

    wx.request({
      url: `${BASE_URL}/api/news`,
      method: 'GET',
      data: { page, limit: this.data.latestLimit },
      success: (res) => {
        if (res.data && res.data.success) {
          const newsList = res.data.data.map(item => ({
            ...item,
            categoryColor: util.getCategoryColor(item.categoryId)
          }));
          const pagination = res.data.pagination || {};
          const hasMore = page < (pagination.pages || 1);
          this.setData({
            latestNews: reset ? newsList : [...this.data.latestNews, ...newsList],
            latestPage: page + 1,
            latestHasMore: hasMore,
            latestLoading: false
          });
        } else {
          this.setData({ latestLoading: false });
        }
      },
      fail: () => {
        console.log('获取最新新闻失败');
        this.setData({ latestLoading: false });
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
    this.initYearList();
    this.setData({ showYearPicker: true });
  },

  onYearPickerClose() {
    this.setData({ showYearPicker: false });
  },

  onMonthPickerTap() {
    if (!this.data.searchYear) {
      wx.showToast({ title: '请先选择年份', icon: 'none' });
      return;
    }
    this.initMonthList(parseInt(this.data.searchYear));
    this.setData({ showMonthPicker: true });
  },

  onMonthPickerClose() {
    this.setData({ showMonthPicker: false });
  },

  onDayPickerTap() {
    if (!this.data.searchYear) {
      wx.showToast({ title: '请先选择年份', icon: 'none' });
      return;
    }
    if (!this.data.searchMonth) {
      wx.showToast({ title: '请先选择月份', icon: 'none' });
      return;
    }
    this.initDayList(parseInt(this.data.searchYear), parseInt(this.data.searchMonth));
    this.setData({ showDayPicker: true });
  },

  onDayPickerClose() {
    this.setData({ showDayPicker: false });
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
      searchMonth: '',
      searchDay: '',
      monthText: '',
      dayText: '',
      showYearPicker: false
    });
    
    if (this.data.searchMode !== 'year') {
      return;
    }
    
    this.setData({ showSearchResults: true, currentPage: 1 });
    this.performDateSearch();
  },

  onMonthSelect(e) {
    const month = e.currentTarget.dataset.month;
    this.setData({
      searchMonth: month,
      searchDay: '',
      dayText: '',
      monthText: `${parseInt(month)}月`,
      showMonthPicker: false
    });
    
    if (this.data.searchMode !== 'month') {
      return;
    }
    
    this.setData({ showSearchResults: true, currentPage: 1 });
    this.performDateSearch();
  },

  onDaySelect(e) {
    const day = e.currentTarget.dataset.day;
    this.setData({
      searchDay: day,
      dayText: `${parseInt(day)}日`,
      showDayPicker: false
    });
    
    this.setData({ showSearchResults: true, currentPage: 1 });
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
              matchCount,
              titleParts: this.buildHighlightParts(item.title, keyword)
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

  // 将标题拆分为普通片段和高亮片段的数组
  buildHighlightParts(title, keyword) {
    if (!keyword || !title) return [{ text: title, highlight: false }];
    const parts = [];
    const lowerTitle = title.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    let lastIndex = 0;
    let index = lowerTitle.indexOf(lowerKeyword);
    while (index !== -1) {
      if (index > lastIndex) {
        parts.push({ text: title.slice(lastIndex, index), highlight: false });
      }
      parts.push({ text: title.slice(index, index + keyword.length), highlight: true });
      lastIndex = index + keyword.length;
      index = lowerTitle.indexOf(lowerKeyword, lastIndex);
    }
    if (lastIndex < title.length) {
      parts.push({ text: title.slice(lastIndex), highlight: false });
    }
    return parts;
  },

  performDateSearch() {
    this.setData({ isSearching: true });

    let keyword = '';
    if (this.data.searchMode === 'day' && this.data.searchYear && this.data.searchMonth && this.data.searchDay) {
      keyword = `${this.data.searchYear}-${this.data.searchMonth}-${this.data.searchDay}`;
    } else if (this.data.searchMode === 'month' && this.data.searchYear && this.data.searchMonth) {
      keyword = `${this.data.searchYear}-${this.data.searchMonth}`;
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
