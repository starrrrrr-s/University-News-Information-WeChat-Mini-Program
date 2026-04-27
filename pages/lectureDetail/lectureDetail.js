const data = require('../../utils/data.js');

Page({
  data: {
    lecture: null
  },

  onLoad(options) {
    if (options.id) {
      this.loadLecture(parseInt(options.id));
    }
  },

  loadLecture(id) {
    const lecture = data.getLectureById(id);
    if (lecture) {
      this.setData({ lecture });
      wx.setNavigationBarTitle({ title: lecture.title });
    } else {
      wx.showToast({ title: '讲座不存在', icon: 'none' });
    }
  },

  onShareAppMessage() {
    const lecture = this.data.lecture;
    return {
      title: lecture ? lecture.title : '高校讲座资讯',
      path: lecture ? '/pages/lectureDetail/lectureDetail?id=' + lecture.id : '/pages/index/index'
    };
  }
});
