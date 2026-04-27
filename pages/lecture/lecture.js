const data = require('../../utils/data.js');

Page({
  data: {
    lectureList: []
  },

  onLoad() {
    this.loadLectures();
  },

  onShow() {
    this.loadLectures();
  },

  loadLectures() {
    const lectures = data.getLectureList();
    this.setData({
      lectureList: lectures
    });
  },

  onLectureTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/lectureDetail/lectureDetail?id=' + id
    });
  }
});