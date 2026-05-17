const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateAdmin() {
  let connection;
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '2003',
      database: 'campus_news'
    });

    console.log('数据库连接成功');

    // 加密密码
    const hashedPassword = bcrypt.hashSync('admin123', 10);

    // 更新管理员账号
    const [result] = await connection.execute(
      'UPDATE users SET username = ?, password = ?, is_admin = ? WHERE openid = ?',
      ['admin', hashedPassword, 1, 'admin']
    );

    if (result.affectedRows > 0) {
      console.log('管理员账号更新成功！');
      console.log('用户名: admin');
      console.log('密码: admin123');
    } else {
      console.log('未找到管理员账号');
    }

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('更新管理员账号失败:', err);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

updateAdmin();