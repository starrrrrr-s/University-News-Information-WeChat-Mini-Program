const Lecture = require('../models/Lecture');
const { success, error, paginate } = require('../utils/response');

// 获取讲座列表
const getLectureList = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Lecture.findAndCountAll({
      order: [['start_time', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return paginate(res, rows, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('获取讲座列表失败:', err);
    return error(res, '获取讲座列表失败');
  }
};

// 获取讲座详情
const getLectureDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const lecture = await Lecture.findByPk(id);

    if (!lecture) {
      return error(res, '讲座不存在');
    }

    return success(res, lecture, '获取讲座详情成功');
  } catch (err) {
    console.error('获取讲座详情失败:', err);
    return error(res, '获取讲座详情失败');
  }
};

// 新增讲座
const createLecture = async (req, res) => {
  try {
    const { title, content, speaker, speaker_title, location, start_time, end_time, organizer, category, is_free, link, max_participants } = req.body;

    if (!title || !speaker || !location || !start_time || !organizer) {
      return error(res, '缺少必要参数');
    }

    const lecture = await Lecture.create({
      title,
      content: content || '',
      speaker,
      speaker_title,
      location,
      start_time,
      end_time,
      organizer,
      category: category || '学术讲座',
      is_free: is_free !== undefined ? is_free : 1,
      link,
      max_participants: max_participants || 0,
      current_participants: 0,
      is_published: 1
    });

    return success(res, lecture, '新增讲座成功');
  } catch (err) {
    console.error('新增讲座失败:', err);
    return error(res, '新增讲座失败');
  }
};

// 更新讲座
const updateLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, speaker, speaker_title, location, start_time, end_time, organizer, category, is_free, link, max_participants, is_published } = req.body;

    const lecture = await Lecture.findByPk(id);
    if (!lecture) {
      return error(res, '讲座不存在');
    }

    await lecture.update({
      title: title !== undefined ? title : lecture.title,
      content: content !== undefined ? content : lecture.content,
      speaker: speaker !== undefined ? speaker : lecture.speaker,
      speaker_title: speaker_title !== undefined ? speaker_title : lecture.speaker_title,
      location: location !== undefined ? location : lecture.location,
      start_time: start_time !== undefined ? start_time : lecture.start_time,
      end_time: end_time !== undefined ? end_time : lecture.end_time,
      organizer: organizer !== undefined ? organizer : lecture.organizer,
      category: category !== undefined ? category : lecture.category,
      is_free: is_free !== undefined ? is_free : lecture.is_free,
      link: link !== undefined ? link : lecture.link,
      max_participants: max_participants !== undefined ? max_participants : lecture.max_participants,
      is_published: is_published !== undefined ? is_published : lecture.is_published
    });

    return success(res, lecture, '更新讲座成功');
  } catch (err) {
    console.error('更新讲座失败:', err);
    return error(res, '更新讲座失败');
  }
};

// 删除讲座
const deleteLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const lecture = await Lecture.findByPk(id);

    if (!lecture) {
      return error(res, '讲座不存在');
    }

    await lecture.destroy();
    return success(res, null, '删除讲座成功');
  } catch (err) {
    console.error('删除讲座失败:', err);
    return error(res, '删除讲座失败');
  }
};

module.exports = {
  getLectureList,
  getLectureDetail,
  createLecture,
  updateLecture,
  deleteLecture
};