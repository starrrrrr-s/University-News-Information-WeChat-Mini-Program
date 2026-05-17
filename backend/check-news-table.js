require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkNewsTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_news'
    });

    console.log('数据库连接成功\n');

    // 查看news表结构
    console.log('=== news 表结构 ===');
    const [columns] = await connection.execute('SHOW COLUMNS FROM news');
    console.table(columns);

    console.log('\n=== 示例数据 ===');
    const [rows] = await connection.execute('SELECT * FROM news LIMIT 1');
    if (rows.length > 0) {
      console.log(JSON.stringify(rows[0], null, 2));
    }

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('检查表结构失败:', err);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

checkNewsTable();
