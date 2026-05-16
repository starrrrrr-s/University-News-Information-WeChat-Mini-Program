const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 从 .env 文件读取配置
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();

async function initAdmin() {
  let connection;
  try {
    // 创建数据库连接，使用 .env 中的配置
    connection = await mysql.createConnection({
      host: env.DB_HOST || 'localhost',
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || '',
      database: env.DB_NAME || 'campus_news'
    });

    console.log('数据库连接成功');

    // 检查管理员账号是否存在（使用openid字段）
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE openid = ?',
      ['admin']
    );

    if (rows.length === 0) {
      // 创建新的管理员账号
      await connection.execute(
        'INSERT INTO users (openid, nickname, is_admin) VALUES (?, ?, ?)',
        ['admin', '系统管理员', 1]
      );

      console.log('管理员账号创建成功: openid=admin, nickname=系统管理员');
    } else {
      // 更新现有管理员信息
      await connection.execute(
        'UPDATE users SET nickname = ?, is_admin = ? WHERE openid = ?',
        ['系统管理员', 1, 'admin']
      );
      console.log('管理员账号已更新');
    }

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('初始化管理员账号失败:', err);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

initAdmin();