const util = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    activeTab: 0,
    newsCollections: [],
    lectureCollections: [],
    isLoggedIn: false,
    editMode: false,
    selectedCount: 0,
    isAllSelected: false
  },

  onLoad() {
    this.checkAndLoad();
  },

  onShow() {
    this.checkAndLoad();
  },

  checkAndLoad() {
    const isLoggedIn = !!app.globalData.userInfo;
    this.setData({ isLoggedIn, editMode: false });
    if (isLoggedIn) {
      this.loadNewsCollections();
      this.loadLectureCollections();
    } else {
      this.setData({ newsCollections: [], lectureCollections: [] });
    }
  },

  loadNewsCollections() {
    const list = util.getCollections();
    const withExtra = list.map(item => ({
      ...item,
      categoryColor: util.getCategoryColor(item.categoryId),
      selected: false
    }));
    this.setData({ newsCollections: withExtra });
    this._updateSelectStats();
  },

  loadLectureCollections() {
    const list = util.getLectureCollections();
    const withExtra = list.map(item => ({
      ...item,
      selected: false
    }));
    this.setData({ lectureCollections: withExtra });
    this._updateSelectStats();
  },

  // 更新选中数量和全选状态
  _updateSelectStats() {
    const list = this.data.activeTab === 0
      ? this.data.newsCollections
      : this.data.lectureCollections;
    const selectedCount = list.filter(item => item.selected).length;
    const isAllSelected = list.length > 0 && selectedCount === list.length;
    this.setData({ selectedCount, isAllSelected });
  },

  // ---- Tab ----
  onTabChange(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    // 切换 tab 时清除选中状态
    const newsList = this.data.newsCollections.map(i => ({ ...i, selected: false }));
    const lectureList = this.data.lectureCollections.map(i => ({ ...i, selected: false }));
    this.setData({
      activeTab: tab,
      editMode: false,
      newsCollections: newsList,
      lectureCollections: lectureList,
      selectedCount: 0,
      isAllSelected: false
    });
  },

  // ---- 编辑模式 ----
  onToggleEditMode() {
    const entering = !this.data.editMode;
    if (!entering) {
      // 退出编辑时清除所有选中
      const newsList = this.data.newsCollections.map(i => ({ ...i, selected: false }));
      const lectureList = this.data.lectureCollections.map(i => ({ ...i, selected: false }));
      this.setData({
        editMode: false,
        newsCollections: newsList,
        lectureCollections: lectureList,
        selectedCount: 0,
        isAllSelected: false
      });
    } else {
      this.setData({ editMode: true, selectedCount: 0, isAllSelected: false });
    }
  },

  // 统一点击处理：编辑模式下切换选中，普通模式下跳转
  onItemTap(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    const type = e.currentTarget.dataset.type; // 'news' | 'lecture'

    if (!this.data.editMode) {
      // 普通模式：跳转详情
      if (type === 'news') {
        wx.navigateTo({ url: '/pages/newsDetail/newsDetail?id=' + id });
      } else {
        wx.navigateTo({ url: '/pages/lectureDetail/lectureDetail?id=' + id });
      }
      return;
    }

    // 编辑模式：切换选中状态
    if (type === 'news') {
      const list = this.data.newsCollections.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      );
      this.setData({ newsCollections: list }, () => this._updateSelectStats());
    } else {
      const list = this.data.lectureCollections.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      );
      this.setData({ lectureCollections: list }, () => this._updateSelectStats());
    }
  },

  // 全选 / 取消全选
  onSelectAll() {
    const shouldSelectAll = !this.data.isAllSelected;
    if (this.data.activeTab === 0) {
      const list = this.data.newsCollections.map(i => ({ ...i, selected: shouldSelectAll }));
      this.setData({ newsCollections: list }, () => this._updateSelectStats());
    } else {
      const list = this.data.lectureCollections.map(i => ({ ...i, selected: shouldSelectAll }));
      this.setData({ lectureCollections: list }, () => this._updateSelectStats());
    }
  },

  // 批量删除
  onBatchDelete() {
    const { selectedCount, activeTab } = this.data;
    if (selectedCount === 0) {
      wx.showToast({ title: '请先选择要取消的项目', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '批量取消收藏',
      content: `确定取消收藏选中的 ${selectedCount} 项吗？`,
      confirmText: '确定',
      confirmColor: '#E64340',
      success: (res) => {
        if (!res.confirm) return;
        if (activeTab === 0) {
          this.data.newsCollections
            .filter(i => i.selected)
            .forEach(i => util.removeFromCollection(i.id));
          this.loadNewsCollections();
        } else {
          this.data.lectureCollections
            .filter(i => i.selected)
            .forEach(i => util.removeLectureFromCollection(i.id));
          this.loadLectureCollections();
        }
        this.setData({ editMode: false, selectedCount: 0, isAllSelected: false });
        wx.showToast({ title: `已取消 ${selectedCount} 项收藏`, icon: 'success' });
      }
    });
  },

  // ---- 单项删除（非编辑模式右侧 ✕ 按钮） ----
  onDeleteNews(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    wx.showModal({
      title: '取消收藏',
      content: '确定要移除这条新闻吗？',
      confirmText: '移除',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          util.removeFromCollection(id);
          this.loadNewsCollections();
          wx.showToast({ title: '已移除', icon: 'success' });
        }
      }
    });
  },

  onDeleteLecture(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    wx.showModal({
      title: '取消收藏',
      content: '确定要移除这个讲座吗？',
      confirmText: '移除',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          util.removeLectureFromCollection(id);
          this.loadLectureCollections();
          wx.showToast({ title: '已移除', icon: 'success' });
        }
      }
    });
  },

  onGoLogin() {
    wx.switchTab({ url: '/pages/personal/personal' });
  }
});
