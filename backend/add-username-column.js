const mysql = require('mysql2/promise');

async function addUsernameColumn() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '2003',
      database: 'campus_news'
    });

    console.log('数据库连接成功');

    await connection.execute(
      'ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;'
    );

    console.log('添加 username 字段成功');

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('添加字段失败:', err);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

addUsernameColumn();