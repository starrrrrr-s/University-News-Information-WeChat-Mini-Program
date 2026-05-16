const app = getApp();
const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    commentList: [],
    page: 1,
    limit: 20,
    hasMore: false,
    loading: false,

    filterType: 'all',    // 'all' | 'news' | 'lecture'
    filterStatus: ''      // '' | '0' | '1' | '2'
  },

  onLoad() {
    this.loadComments(true);
  },

  onShow() {
    this.loadComments(true);
  },

  onFilterType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type });
    this.loadComments(true);
  },

  onFilterStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ filterStatus: status });
    this.loadComments(true);
  },

  loadComments(reset = false) {
    if (this.data.loading) return;

    const page = reset ? 1 : this.data.page;
    const token = wx.getStorageSync('token');

    const params = { page, limit: this.data.limit };
    if (this.data.filterType !== 'all') {
      params.target_type = this.data.filterType;
    }
    if (this.data.filterStatus !== '') {
      params.status = this.data.filterStatus;
    }

    this.setData({ loading: true });

    wx.request({
      url: `${BASE_URL}/api/admin/comments`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      data: params,
      success: (res) => {
        if (res.data && res.data.success) {
          const newList = (res.data.data || []).map(c => ({
            ...c,
            createdAt: this.formatTime(c.createdAt)
          }));
          const pagination = res.data.pagination || {};
          const commentList = reset ? newList : [...this.data.commentList, ...newList];
          this.setData({
            commentList,
            page: page + 1,
            hasMore: pagination.page < pagination.pages
          });
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误，请检查后端服务', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  loadMore() {
    this.loadComments(false);
  },

  /** 通过评论 */
  onApprove(e) {
    const id = e.currentTarget.dataset.id;
    this.updateStatus(id, 1, '通过');
  },

  /** 拒绝评论 */
  onReject(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝该评论吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateStatus(id, 2, '拒绝');
        }
      }
    });
  },

  updateStatus(id, status, action) {
    const token = wx.getStorageSync('token');
    wx.request({
      url: `${BASE_URL}/api/admin/comments/${id}/status`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { status },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: `${action}成功`, icon: 'success' });
          // 更新本地列表（统一转为数字比较）
          const numId = parseInt(id);
          const commentList = this.data.commentList.map(c => {
            if (c.id === numId) return { ...c, status };
            return c;
          });
          this.setData({ commentList });
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  /** 置顶/取消置顶 */
  onSetTop(e) {
    const id = e.currentTarget.dataset.id;
    const isTop = parseInt(e.currentTarget.dataset.top);
    const token = wx.getStorageSync('token');

    wx.request({
      url: `${BASE_URL}/api/admin/comments/${id}/top`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { is_top: isTop },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: isTop ? '置顶成功' : '已取消置顶', icon: 'success' });
          const numId = parseInt(id);
          const commentList = this.data.commentList.map(c => {
            if (c.id === numId) return { ...c, is_top: isTop };
            return c;
          });
          this.setData({ commentList });
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  /** 删除评论 */
  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该评论吗？',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          const token = wx.getStorageSync('token');
          wx.request({
            url: `${BASE_URL}/api/admin/comments/${id}`,
            method: 'DELETE',
            header: { 'Authorization': `Bearer ${token}` },
            success: (res) => {
              if (res.data && res.data.success) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                const numId = parseInt(id);
                const commentList = this.data.commentList.filter(c => c.id !== numId);
                this.setData({ commentList });
              } else {
                wx.showToast({ title: res.data.message || '删除失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    });
  },

  formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  }
});
