function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getCategoryName(categoryId) {
  const categoryMap = {
    1: '立德树人',
    2: '科技创新',
    3: '学术动态',
    4: '媒体地大'
  };
  return categoryMap[categoryId] || '未分类';
}

function getCategoryColor(categoryId) {
  const colorMap = {
    1: '#1AAD19',
    2: '#0000FF',
    3: '#FFA500',
    4: '#FF69B4'
  };
  return colorMap[categoryId] || '#999999';
}

function isNewsCollected(newsId) {
  const collections = wx.getStorageSync('collections') || [];
  const targetId = String(newsId);
  return collections.some(item => String(item.id) === targetId);
}

function addToCollection(news) {
  const collections = wx.getStorageSync('collections') || [];
  const exists = collections.some(item => String(item.id) === String(news.id));
  if (!exists) {
    collections.push(news);
    wx.setStorageSync('collections', collections);
    return true;
  }
  return false;
}

function removeFromCollection(newsId) {
  let collections = wx.getStorageSync('collections') || [];
  const idToRemove = String(newsId);
  collections = collections.filter(item => String(item.id) !== idToRemove);
  wx.setStorageSync('collections', collections);
  return true;
}

function getCollections() {
  return wx.getStorageSync('collections') || [];
}

function isLectureCollected(lectureId) {
  const collections = wx.getStorageSync('lectureCollections') || [];
  const targetId = String(lectureId);
  return collections.some(item => String(item.id) === targetId);
}

function addLectureToCollection(lecture) {
  const collections = wx.getStorageSync('lectureCollections') || [];
  const exists = collections.some(item => String(item.id) === String(lecture.id));
  if (!exists) {
    collections.push(lecture);
    wx.setStorageSync('lectureCollections', collections);
    return true;
  }
  return false;
}

function removeLectureFromCollection(lectureId) {
  let collections = wx.getStorageSync('lectureCollections') || [];
  const idToRemove = String(lectureId);
  collections = collections.filter(item => String(item.id) !== idToRemove);
  wx.setStorageSync('lectureCollections', collections);
  return true;
}

function getLectureCollections() {
  return wx.getStorageSync('lectureCollections') || [];
}

module.exports = {
  formatDate,
  formatTime,
  getCategoryName,
  getCategoryColor,
  isNewsCollected,
  addToCollection,
  removeFromCollection,
  getCollections,
  isLectureCollected,
  addLectureToCollection,
  removeLectureFromCollection,
  getLectureCollections
};
