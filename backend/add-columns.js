const mysql = require('mysql2/promise');

async function addColumns() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password,
      database: 'campus_news'
    });

    console.log('数据库连接成功');

    await connection.execute(
      'ALTER TABLE users ADD COLUMN password VARCHAR(255);'
    );

    console.log('添加 password 字段成功');

    await connection.end();
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('password 字段已存在');
      await connection.end();
      process.exit(0);
    }
    console.error('添加字段失败:', err);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

addColumns();