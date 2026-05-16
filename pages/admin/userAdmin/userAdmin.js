const BASE_URL = 'http://localhost:3000';
const STORAGE_KEY_USERS = 'user_list';

const defaultUsers = [
  {
    id: 1,
    nickName: '管理员',
    avatarUrl: '',
    isAdmin: false,
    registerDate: '2024-01-01'
  }
];

Page({
  data: {
    userList: [],

    // 用户评论弹窗
    showCommentModal: false,
    currentUserId: null,
    currentUserName: '',
    userComments: [],
    commentsLoading: false
  },

  onLoad() {
    this.loadUsers();
  },

  onShow() {
    this.loadUsers();
  },

  loadUsers() {
    let users = wx.getStorageSync(STORAGE_KEY_USERS) || defaultUsers;

    const currentUser = wx.getStorageSync('userInfo');
    if (currentUser && currentUser.nickName) {
      const exists = users.some(u => u.nickName === currentUser.nickName);
      if (!exists) {
        const maxId = users.reduce((max, u) => u.id > max ? u.id : max, 0);
        users.push({
          id: maxId + 1,
          nickName: currentUser.nickName,
          avatarUrl: currentUser.avatarUrl || '',
          isAdmin: currentUser.isAdmin || false,
          registerDate: new Date().toISOString().split('T')[0]
        });
        wx.setStorageSync(STORAGE_KEY_USERS, users);
      }
    }

    this.setData({ userList: users });
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
          let users = wx.getStorageSync(STORAGE_KEY_USERS) || [];
          const index = users.findIndex(u => u.id === id);
          if (index !== -1) {
            users[index].isAdmin = !isAdmin;
            wx.setStorageSync(STORAGE_KEY_USERS, users);
            this.setData({ userList: users });
            wx.showToast({ title: '操作成功', icon: 'success' });
          }
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
