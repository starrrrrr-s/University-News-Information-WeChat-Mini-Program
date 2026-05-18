const BASE_URL = 'http://localhost:3001';
const app = getApp();

Page({
  data: {
    userList: [],
    loading: false,

    // 用户评论弹窗
    showCommentModal: false,
    currentUserId: null,
    currentUserName: '',
    userComments: [],
    commentsLoading: false
  },

  onLoad() {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.loadUsers();
  },

  onShow() {
    // 应用主题颜色
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.loadUsers();
  },

  loadUsers() {
    this.setData({ loading: true });
    
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/admin/users`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data && res.data.success) {
          const users = (res.data.data || []).map(user => ({
            id: user.id,
            nickName: user.nickname,
            avatarUrl: user.avatar_url || '',
            isAdmin: user.is_admin || false,
            isBlocked: user.is_blocked || false,
            registerDate: user.created_at || user.updated_at || ''
          }));
          this.setData({ userList: users });
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

  onToggleAdmin(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    const isAdmin = e.currentTarget.dataset.isadmin;
    const action = isAdmin ? '取消管理员权限' : '设为管理员';

    wx.showModal({
      title: '确认操作',
      content: `确定要${action}吗？`,
      success: (res) => {
        if (res.confirm) {
          const token = wx.getStorageSync('token');
          wx.request({
            url: `${BASE_URL}/api/admin/users/${id}`,
            method: 'PUT',
            header: { 'Authorization': `Bearer ${token}` },
            data: { is_admin: !isAdmin },
            success: (res) => {
              if (res.data && res.data.success) {
                wx.showToast({ title: '操作成功', icon: 'success' });
                this.loadUsers(); // 刷新用户列表
              } else {
                wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
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

  // ─── 拉黑/解封用户 ────────────────────────────────────────────

  onToggleBlock(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    const isBlocked = e.currentTarget.dataset.isblocked === 'true';
    const action = isBlocked ? '解封' : '拉黑';

    wx.showModal({
      title: '确认操作',
      content: `确定要${action}该用户吗？`,
      success: (res) => {
        if (res.confirm) {
          const token = wx.getStorageSync('token');
          const url = isBlocked 
            ? `${BASE_URL}/api/admin/users/${id}/unblock` 
            : `${BASE_URL}/api/admin/users/${id}/block`;
          
          wx.request({
            url: url,
            method: 'PUT',
            header: { 'Authorization': `Bearer ${token}` },
            success: (res) => {
              if (res.data && res.data.success) {
                wx.showToast({ title: `${action}成功`, icon: 'success' });
                this.loadUsers(); // 刷新用户列表
              } else {
                wx.showToast({ title: res.data.message || `${action}失败`, icon: 'none' });
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

  // ─── 查看用户评论 ────────────────────────────────────────────

  onViewUserComments(e) {
    const userId = e.currentTarget.dataset.id;
    const userName = e.currentTarget.dataset.name;

    this.setData({
      showCommentModal: true,
      currentUserId: userId,
      currentUserName: userName,
      userComments: [],
      commentsLoading: true
    });

    const token = wx.getStorageSync('token');

    wx.request({
      url: `${BASE_URL}/api/admin/users/${userId}/comments`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      data: { page: 1, limit: 50 },
      success: (res) => {
        if (res.data && res.data.success) {
          const comments = (res.data.data || []).map(c => ({
            ...c,
            createdAt: this.formatTime(c.createdAt)
          }));
          this.setData({ userComments: comments });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误，请检查后端服务', icon: 'none' });
      },
      complete: () => {
        this.setData({ commentsLoading: false });
      }
    });
  },

  onCloseCommentModal() {
    this.setData({ showCommentModal: false, userComments: [] });
  },

  onDeleteUserComment(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该评论吗？',
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
                const userComments = this.data.userComments.filter(c => c.id !== id);
                this.setData({ userComments });
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
    return `${y}-${m}-${day}`;
  }
});
