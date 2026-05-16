// 成功响应
const success = (res, data = null, message = '操作成功') => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};

// 失败响应
const error = (res, message = '操作失败', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

// 分页响应
const paginate = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    message: '操作成功',
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
};

module.exports = {
  success,
  error,
  paginate
};