const app = getApp();

const BASE_URL = 'http://localhost:3001';

// 处理状态映射
const STATUS_MAP = {
  0: { text: '待处理', class: 'pending' },
  1: { text: '处理中', class: 'processing' },
  2: { text: '已处理', class: 'done' }
};

Page({
  data: {
    feedbackList: [],
    loading: false,
    page: 1,
    hasMore: true,
    currentFilter: '', // 状态筛选
    showReplyModal: false,
    currentFeedback: null,
    replyContent: ''
  },

  onLoad() {
    this.loadFeedbackList(true);
  },

  onPullDownRefresh() {
    this.loadFeedbackList(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadFeedbackList(false);
    }
  },

  async loadFeedbackList(reset = false) {
    if (this.data.loading) return;

    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });

    const token = wx.getStorageSync('token');

    return new Promise((resolve) => {
      wx.request({
        url: `${BASE_URL}/api/feedback`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: {
          page,
          limit: 20,
          status: this.data.currentFilter
        },
        success: (res) => {
          if (res.data && res.data.success) {
            const list = res.data.data.list || [];
            const formattedList = list.map(item => ({
              ...item,
              statusText: STATUS_MAP[item.status]?.text || '未知',
              statusClass: STATUS_MAP[item.status]?.class || '',
              created_at: this.formatTime(item.created_at)
            }));

            this.setData({
              feedbackList: reset ? formattedList : [...this.data.feedbackList, ...formattedList],
              page: page + 1,
              hasMore: res.data.data.pagination.page < res.data.data.pagination.pages
            });
          }
        },
        fail: () => {
          // 离线模式，读取本地存储
          const localFeedback = wx.getStorageSync('local_feedback') || [];
          const formattedList = localFeedback.map(item => ({
            ...item,
            status: 0,
            statusText: '待处理',
            statusClass: 'pending',
            created_at: this.formatTime(item.createdAt)
          }));
          this.setData({
            feedbackList: formattedList,
            hasMore: false
          });
        },
        complete: () => {
          this.setData({ loading: false });
          resolve();
        }
      });
    });
  },

  // 筛选状态
  onFilterChange(e) {
    const value = e.detail.value;
    const filter = value === '全部' ? '' : (value === '待处理' ? '0' : value === '处理中' ? '1' : '2');
    this.setData({ currentFilter: filter });
    this.loadFeedbackList(true);
  },

  // 显示回复弹窗
  showReplyDialog(e) {
    const { id, content, type } = e.currentTarget.dataset;
    const feedback = this.data.feedbackList.find(f => f.id === id);
    this.setData({
      showReplyModal: true,
      currentFeedback: feedback,
      replyContent: feedback.reply || ''
    });
  },

  // 关闭弹窗
  hideReplyModal() {
    this.setData({
      showReplyModal: false,
      currentFeedback: null,
      replyContent: ''
    });
  },

  // 输入回复内容
  onReplyInput(e) {
    this.setData({ replyContent: e.detail.value });
  },

  // 提交回复
  submitReply() {
    const { currentFeedback, replyContent } = this.data;
    if (!currentFeedback) return;

    const token = wx.getStorageSync('token');

    wx.showLoading({ title: '提交中...' });

    wx.request({
      url: `${BASE_URL}/api/feedback/${currentFeedback.id}`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        reply: replyContent,
        status: 2 // 标记为已处理
      },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: '回复成功', icon: 'success' });
          this.hideReplyModal();
          this.loadFeedbackList(true);
        } else {
          wx.showToast({ title: res.data.message || '回复失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 删除反馈
  deleteFeedback(e) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条反馈吗？',
      success: (res) => {
        if (res.confirm) {
          this.doDelete(id);
        }
      }
    });
  },

  doDelete(id) {
    const token = wx.getStorageSync('token');

    wx.showLoading({ title: '删除中...' });

    wx.request({
      url: `${BASE_URL}/api/feedback/${id}`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.loadFeedbackList(true);
        } else {
          wx.showToast({ title: res.data.message || '删除失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hour}:${min}`;
  }
});
