const data = require('../../../utils/data.js');
const app = getApp();

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    lectureId: null,
    isEdit: false,
    title: '',
    speaker: '',
    speakerTitle: '',
    location: '',
    date: '',
    time: '',
    organizer: '',
    selectedCategoryIndex: 0,
    isFree: true,
    content: '',
    categoryList: ['学术讲座', '创新创业', '心理健康', '职业发展', '学术交流']
  },

  onLoad(options) {
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    if (options.id) {
      this.setData({ isEdit: true });
      this.loadLecture(parseInt(options.id));
      wx.setNavigationBarTitle({ title: '编辑讲座' });
    } else {
      wx.setNavigationBarTitle({ title: '添加讲座' });
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      this.setData({ date: `${y}-${m}-${d}`, time: '14:00' });
    }
  },

  loadLecture(id) {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: `${BASE_URL}/api/lectures/${id}`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          const lecture = res.data.data;
          const categoryIndex = this.data.categoryList.indexOf(lecture.category || '');
          const parts = lecture.start_time ? lecture.start_time.split(' ') : ['', ''];
          this.setData({
            lectureId: lecture.id,
            title: lecture.title,
            speaker: lecture.speaker,
            speakerTitle: lecture.speaker_title,
            location: lecture.location,
            date: parts[0] || '',
            time: parts[1] || '',
            organizer: lecture.organizer,
            selectedCategoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
            isFree: lecture.is_free === 1,
            content: lecture.content || ''
          });
        } else {
          this.loadLectureFromLocal(id);
        }
      },
      fail: () => {
        this.loadLectureFromLocal(id);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  loadLectureFromLocal(id) {
    const lecture = data.getLectureById(id);
    if (lecture) {
      const categoryIndex = this.data.categoryList.indexOf(lecture.category);
      const parts = lecture.time ? lecture.time.split(' ') : ['', ''];
      this.setData({
        lectureId: lecture.id,
        title: lecture.title,
        speaker: lecture.speaker,
        speakerTitle: lecture.speakerTitle,
        location: lecture.location,
        date: parts[0] || '',
        time: parts[1] || '',
        organizer: lecture.organizer,
        selectedCategoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
        isFree: lecture.isFree,
        content: lecture.content
      });
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onSpeakerInput(e) { this.setData({ speaker: e.detail.value }); },
  onSpeakerTitleInput(e) { this.setData({ speakerTitle: e.detail.value }); },
  onLocationInput(e) { this.setData({ location: e.detail.value }); },
  onOrganizerInput(e) { this.setData({ organizer: e.detail.value }); },
  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onCategoryChange(e) {
    this.setData({ selectedCategoryIndex: parseInt(e.detail.value) });
  },
  onIsFreeChange(e) { this.setData({ isFree: e.detail.value }); },
  onContentInput(e) { this.setData({ content: e.detail.value }); },

  onSave() {
    const { title, speaker, date, time, location, organizer, selectedCategoryIndex, isFree, content, speakerTitle, categoryList } = this.data;

    if (!title.trim()) {
      wx.showToast({ title: '请输入讲座标题', icon: 'none' });
      return;
    }
    if (!speaker.trim()) {
      wx.showToast({ title: '请输入主讲人', icon: 'none' });
      return;
    }
    if (!date || !time) {
      wx.showToast({ title: '请选择日期和时间', icon: 'none' });
      return;
    }
    if (!location.trim()) {
      wx.showToast({ title: '请输入讲座地点', icon: 'none' });
      return;
    }
    if (!organizer.trim()) {
      wx.showToast({ title: '请输入主办方', icon: 'none' });
      return;
    }

    console.log('所有验证通过，准备保存讲座');

    const lectureItem = {
      title: (title || '').trim(),
      speaker: (speaker || '').trim(),
      speaker_title: (speakerTitle || '').trim(),
      location: (location || '').trim(),
      start_time: `${date} ${time}`,
      organizer: (organizer || '').trim(),
      category: categoryList[selectedCategoryIndex],
      is_free: isFree ? 1 : 0,
      content: (content || '').trim()
    };

    const token = wx.getStorageSync('token');
    wx.showLoading({ title: '保存中...' });

    if (this.data.isEdit) {
      lectureItem.id = this.data.lectureId;
      wx.request({
        url: `${BASE_URL}/api/lectures/${this.data.lectureId}`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: lectureItem,
        success: (res) => {
          if (res.data && res.data.success) {
            wx.showToast({ title: '更新成功', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showToast({ title: res.data.message || '更新失败', icon: 'none' });
          }
        },
        fail: () => {
          data.updateLecture(lectureItem);
          wx.showToast({ title: '更新成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } else {
      wx.request({
        url: `${BASE_URL}/api/lectures`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: lectureItem,
        success: (res) => {
          if (res.data && res.data.success) {
            wx.showToast({ title: '添加成功', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showToast({ title: res.data.message || '添加失败', icon: 'none' });
          }
        },
        fail: () => {
          data.addLecture(lectureItem);
          wx.showToast({ title: '添加成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    }
  }
});
