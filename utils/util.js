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
    1: '学校要闻',
    2: '学术动态',
    3: '教学园地',
    4: '校园文化',
    5: '人物风采'
  };
  return categoryMap[categoryId] || '未分类';
}

function getCategoryColor(categoryId) {
  const colorMap = {
    1: '#1AAD19',
    2: '#0000FF',
    3: '#FFA500',
    4: '#FF69B4',
    5: '#9932CC'
  };
  return colorMap[categoryId] || '#999999';
}

function isNewsCollected(newsId) {
  const collections = wx.getStorageSync('collections') || [];
  return collections.some(item => item.id === newsId);
}

function addToCollection(news) {
  const collections = wx.getStorageSync('collections') || [];
  const exists = collections.some(item => item.id === news.id);
  if (!exists) {
    collections.push(news);
    wx.setStorageSync('collections', collections);
    return true;
  }
  return false;
}

function removeFromCollection(newsId) {
  let collections = wx.getStorageSync('collections') || [];
  collections = collections.filter(item => item.id !== newsId);
  wx.setStorageSync('collections', collections);
  return true;
}

function getCollections() {
  return wx.getStorageSync('collections') || [];
}

module.exports = {
  formatDate,
  formatTime,
  getCategoryName,
  getCategoryColor,
  isNewsCollected,
  addToCollection,
  removeFromCollection,
  getCollections
};