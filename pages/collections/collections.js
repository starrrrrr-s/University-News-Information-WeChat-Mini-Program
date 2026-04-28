const util = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    activeTab: 0,           // 0=新闻收藏 1=讲座收藏
    newsCollections: [],
    lectureCollections: [],
    isLoggedIn: false,
    // 批量编辑状态
    editMode: false,
    selectedIds: []         // 当前 tab 下选中的 id 列表
  },

  onLoad() {
    this.checkAndLoad();
  },

  onShow() {
    this.checkAndLoad();
  },

  checkAndLoad() {
    const isLoggedIn = !!app.globalData.userInfo;
    this.setData({ isLoggedIn, editMode: false, selectedIds: [] });
    if (isLoggedIn) {
      this.loadNewsCollections();
      this.loadLectureCollections();
    } else {
      this.setData({ newsCollections: [], lectureCollections: [] });
    }
  },

  loadNewsCollections() {
    const list = util.getCollections();
    const withColor = list.map(item => ({
      ...item,
      categoryColor: util.getCategoryColor(item.categoryId)
    }));
    this.setData({ newsCollections: withColor });
  },

  loadLectureCollections() {
    const list = util.getLectureCollections();
    this.setData({ lectureCollections: list });
  },

  // ---- Tab ----
  onTabChange(e) {
    this.setData({
      activeTab: parseInt(e.currentTarget.dataset.tab),
      editMode: false,
      selectedIds: []
    });
  },

  // ---- 编辑模式 ----
  onToggleEditMode() {
    this.setData({ editMode: !this.data.editMode, selectedIds: [] });
  },

  onToggleSelect(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    let selected = [...this.data.selectedIds];
    const idx = selected.indexOf(id);
    if (idx === -1) {
      selected.push(id);
    } else {
      selected.splice(idx, 1);
    }
    this.setData({ selectedIds: selected });
  },

  onSelectAll() {
    const list = this.data.activeTab === 0
      ? this.data.newsCollections
      : this.data.lectureCollections;
    const allIds = list.map(item => item.id);
    // 若已全选则反选（取消全选）
    if (this.data.selectedIds.length === allIds.length) {
      this.setData({ selectedIds: [] });
    } else {
      this.setData({ selectedIds: allIds });
    }
  },

  onBatchDelete() {
    const { selectedIds, activeTab } = this.data;
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请先选择要删除的项目', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '批量取消收藏',
      content: `确定取消收藏选中的 ${selectedIds.length} 项吗？`,
      confirmText: '确定',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          if (activeTab === 0) {
            selectedIds.forEach(id => util.removeFromCollection(id));
            this.loadNewsCollections();
          } else {
            selectedIds.forEach(id => util.removeLectureFromCollection(id));
            this.loadLectureCollections();
          }
          this.setData({ selectedIds: [], editMode: false });
          wx.showToast({ title: `已取消 ${selectedIds.length} 项收藏`, icon: 'success' });
        }
      }
    });
  },

  // ---- 单项操作（非编辑模式） ----
  onNewsTap(e) {
    if (this.data.editMode) return; // 编辑模式下点击不跳转
    wx.navigateTo({ url: '/pages/newsDetail/newsDetail?id=' + e.currentTarget.dataset.id });
  },

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

  onLectureTap(e) {
    if (this.data.editMode) return;
    wx.navigateTo({ url: '/pages/lectureDetail/lectureDetail?id=' + e.currentTarget.dataset.id });
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
