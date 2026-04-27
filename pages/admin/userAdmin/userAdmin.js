const STORAGE_KEY_USERS = 'user_list';

const defaultUsers = [
  {
    id: 1,
    nickName: '管理员',
    avatarUrl: '',
    isAdmin: true,
    registerDate: '2024-01-01'
  }
];

Page({
  data: {
    userList: []
  },

  onLoad() {
    this.loadUsers();
  },

  onShow() {
    this.loadUsers();
  },

  loadUsers() {
    // 从 Storage 读取用户列表，合并当前登录用户
    let users = wx.getStorageSync(STORAGE_KEY_USERS) || defaultUsers;

    // 将当前登录用户加入列表（如果不存在）
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
  }
});
