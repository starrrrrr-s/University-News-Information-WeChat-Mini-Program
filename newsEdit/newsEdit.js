const data = require('../../../utils/data.js');

Page({
  data: {
    newsId: null,
    isEdit: false,
    title: '',
    categoryId: 1,
    selectedCategoryIndex: 0,
    author: '',
    date: '',
    summary: '',
    content: '',
    categoryList: [],
    isTimedPublish: false,
    publishTime: '',
    publishDate: ''
  },

  onLoad(options) {
    this.loadCategories();
    if (options.id) {
      this.setData({ isEdit: true });
      this.loadNews(parseInt(options.id));
      wx.setNavigationBarTitle({ title: '编辑新闻' });
    } else {
      wx.setNavigationBarTitle({ title: '添加新闻' });
      // 默认日期为今天
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const h = String(today.getHours()).padStart(2, '0');
      const minute = String(today.getMinutes()).padStart(2, '0');
      this.setData({ 
        date: `${y}-${m}-${d}`,
        publishDate: `${y}-${m}-${d}`,
        publishTime: `${h}:${minute}`
      });
    }
  },

  loadCategories() {
    const categories = data.getCategoryList();
    this.setData({ categoryList: categories });
  },

  loadNews(id) {
    const news = data.getNewsByIdForAdmin(id);
    if (news) {
      const categories = this.data.categoryList;
      const idx = categories.findIndex(c => c.id === news.categoryId);
      this.setData({
        newsId: news.id,
        title: news.title,
        categoryId: news.categoryId,
        selectedCategoryIndex: idx >= 0 ? idx : 0,
        author: news.author,
        date: news.date,
        summary: news.summary,
        content: news.content,
        isTimedPublish: news.isTimed || false,
        publishDate: news.date || '',
        publishTime: news.publishTime || ''
      });
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onCategoryChange(e) {
    const index = parseInt(e.detail.value);
    const category = this.data.categoryList[index];
    this.setData({
      selectedCategoryIndex: index,
      categoryId: category.id
    });
  },

  onAuthorInput(e) {
    this.setData({ author: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onSummaryInput(e) {
    this.setData({ summary: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onTimedPublishChange(e) {
    this.setData({ isTimedPublish: e.detail.value });
  },

  onPublishDateChange(e) {
    this.setData({ publishDate: e.detail.value });
  },

  onPublishTimeChange(e) {
    this.setData({ publishTime: e.detail.value });
  },

  onSave() {
    const { title, categoryId, author, date, summary, content, categoryList, isTimedPublish, publishDate, publishTime } = this.data;

    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!author.trim()) {
      wx.showToast({ title: '请输入作者', icon: 'none' });
      return;
    }
    if (!date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    if (isTimedPublish && (!publishDate || !publishTime)) {
      wx.showToast({ title: '请选择定时发布时间', icon: 'none' });
      return;
    }
    if (!summary.trim()) {
      wx.showToast({ title: '请输入摘要', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    const categoryObj = categoryList.find(c => c.id === categoryId) || categoryList[0];
    const newsItem = {
      title: title.trim(),
      categoryId: categoryObj.id,
      category: categoryObj.name,
      author: author.trim(),
      date: isTimedPublish ? publishDate : date,
      publishTime: isTimedPublish ? publishTime : null,
      isTimed: isTimedPublish,
      summary: summary.trim(),
      content: content.trim(),
      image: '/images/news_default.jpg'
    };

    if (this.data.isEdit) {
      newsItem.id = this.data.newsId;
      data.updateNews(newsItem);
      wx.showToast({ title: '更新成功', icon: 'success' });
    } else {
      data.addNews(newsItem);
      wx.showToast({ title: isTimedPublish ? '定时发布设置成功' : '添加成功', icon: 'success' });
    }

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
});
