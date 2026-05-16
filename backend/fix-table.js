require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixUserTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_news'
    });

    console.log('数据库连接成功');

    // 检查 username 字段是否存在
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'username'"
    );

    if (columns.length === 0) {
      console.log('正在添加 username 字段...');
      await connection.execute(
        "ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE AFTER openid"
      );
      console.log('username 字段添加成功');
    } else {
      console.log('username 字段已存在');
    }

    // 检查 password 字段是否存在
    const [pwdColumns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'password'"
    );

    if (pwdColumns.length === 0) {
      console.log('正在添加 password 字段...');
      await connection.execute(
        "ALTER TABLE users ADD COLUMN password VARCHAR(255) AFTER username"
      );
      console.log('password 字段添加成功');
    } else {
      console.log('password 字段已存在');
    }

    await connection.end();
    console.log('表结构修复完成');
    process.exit(0);
  } catch (err) {
    console.error('修复表结构失败:', err);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

fixUserTable();