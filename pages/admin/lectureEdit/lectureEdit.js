const data = require('../../../utils/data.js');

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

    const lectureItem = {
      title: title.trim(),
      speaker: speaker.trim(),
      speakerTitle: speakerTitle.trim(),
      location: location.trim(),
      time: `${date} ${time}`,
      organizer: organizer.trim(),
      category: categoryList[selectedCategoryIndex],
      isFree,
      content: content.trim(),
      image: '/images/lecture_default.jpg'
    };

    if (this.data.isEdit) {
      lectureItem.id = this.data.lectureId;
      data.updateLecture(lectureItem);
      wx.showToast({ title: '更新成功', icon: 'success' });
    } else {
      data.addLecture(lectureItem);
      wx.showToast({ title: '添加成功', icon: 'success' });
    }

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
});
