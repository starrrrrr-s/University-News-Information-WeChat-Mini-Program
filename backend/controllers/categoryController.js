const Category = require('../models/Category');
const { success, error } = require('../utils/response');

// 获取分类列表
const getCategoryList = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['id', 'ASC']]
    });

    return success(res, categories, '获取分类列表成功');
  } catch (err) {
    console.error('获取分类列表失败:', err);
    return error(res, '获取分类列表失败');
  }
};

// 新增分类
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return error(res, '缺少分类名称');
    }

    const category = await Category.create({
      name
    });

    return success(res, category, '新增分类成功');
  } catch (err) {
    console.error('新增分类失败:', err);
    return error(res, '新增分类失败');
  }
};

// 更新分类
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return error(res, '分类不存在');
    }

    await category.update({
      name: name || category.name
    });

    return success(res, category, '更新分类成功');
  } catch (err) {
    console.error('更新分类失败:', err);
    return error(res, '更新分类失败');
  }
};

// 删除分类
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return error(res, '分类不存在');
    }

    await category.destroy();
    return success(res, null, '删除分类成功');
  } catch (err) {
    console.error('删除分类失败:', err);
    return error(res, '删除分类失败');
  }
};

module.exports = {
  getCategoryList,
  createCategory,
  updateCategory,
  deleteCategory
};