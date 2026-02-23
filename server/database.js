const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// 启用外键
db.pragma('foreign_keys = ON');

console.log('开始初始化数据库...');

// 用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department_id INTEGER,
    position_id INTEGER,
    role TEXT DEFAULT 'employee',
    feishu_user_id TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 部门表
db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    manager_id INTEGER,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 岗位表
db.exec(`
  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    department_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 岗位职责表
db.exec(`
  CREATE TABLE IF NOT EXISTS job_responsibilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    weight REAL DEFAULT 10,
    kpi_criteria TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 题库表
db.exec(`
  CREATE TABLE IF NOT EXISTS question_bank (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    options TEXT,
    correct_answer TEXT NOT NULL,
    category TEXT,
    difficulty TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 考试场次表
db.exec(`
  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    target_position_id INTEGER,
    question_count INTEGER DEFAULT 10,
    total_score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 考试记录表
db.exec(`
  CREATE TABLE IF NOT EXISTS exam_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exam_id INTEGER NOT NULL,
    score REAL,
    answers TEXT,
    submit_time DATETIME,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 飞书日报表
db.exec(`
  CREATE TABLE IF NOT EXISTS feishu_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    feishu_user_id TEXT,
    report_date DATE NOT NULL,
    content TEXT,
    submit_time DATETIME,
    original_url TEXT,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 绩效考核表
db.exec(`
  CREATE TABLE IF NOT EXISTS performance_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    cycle TEXT NOT NULL,
    exam_score REAL DEFAULT 0,
    kpi_score REAL DEFAULT 0,
    daily_log_score REAL DEFAULT 0,
    final_score REAL DEFAULT 0,
    manager_comment TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 飞书配置表
db.exec(`
  CREATE TABLE IF NOT EXISTS feishu_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT,
    app_secret TEXT,
    tenant_access_token TEXT,
    token_expires_at DATETIME,
    status TEXT DEFAULT 'inactive',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 插入默认管理员
const bcrypt = require('bcryptjs');
const adminPassword = bcrypt.hashSync('admin123', 10);
try {
  db.exec(`INSERT OR IGNORE INTO users (username, password, email, role, status) VALUES ('admin', '${adminPassword}', 'admin@company.com', 'admin', 'active')`);
} catch (e) {}

// 插入示例部门
try {
  db.exec(`INSERT OR IGNORE INTO departments (id, name) VALUES (1, '技术部')`);
  db.exec(`INSERT OR IGNORE INTO departments (id, name) VALUES (2, '产品部')`);
  db.exec(`INSERT OR IGNORE INTO departments (id, name) VALUES (3, '运营部')`);
  db.exec(`INSERT OR IGNORE INTO departments (id, name) VALUES (4, '市场部')`);
} catch (e) {}

// 插入示例岗位
try {
  db.exec(`INSERT OR IGNORE INTO positions (id, name, department_id) VALUES (1, '前端开发工程师', 1)`);
  db.exec(`INSERT OR IGNORE INTO positions (id, name, department_id) VALUES (2, '后端开发工程师', 1)`);
  db.exec(`INSERT OR IGNORE INTO positions (id, name, department_id) VALUES (3, '产品经理', 2)`);
  db.exec(`INSERT OR IGNORE INTO positions (id, name, department_id) VALUES (4, '运营专员', 3)`);
  db.exec(`INSERT OR IGNORE INTO positions (id, name, department_id) VALUES (5, '市场专员', 4)`);
} catch (e) {}

// 插入示例岗位职责
try {
  db.exec(`INSERT OR IGNORE INTO job_responsibilities (position_id, content, weight, kpi_criteria) VALUES (1, '按时完成前端页面开发', 30, '代码质量评分 >= 80')`);
  db.exec(`INSERT OR IGNORE INTO job_responsibilities (position_id, content, weight, kpi_criteria) VALUES (1, '参与技术方案评审', 20, '评审会议参与率 >= 90%')`);
  db.exec(`INSERT OR IGNORE INTO job_responsibilities (position_id, content, weight, kpi_criteria) VALUES (1, '保证代码规范和文档更新', 25, '文档完整性评分 >= 85')`);
  db.exec(`INSERT OR IGNORE INTO job_responsibilities (position_id, content, weight, kpi_criteria) VALUES (1, '及时响应线上问题', 25, '问题响应时间 <= 2小时')`);
  db.exec(`INSERT OR IGNORE INTO job_responsibilities (position_id, content, weight, kpi_criteria) VALUES (2, '完成API接口开发', 30, '接口测试通过率100%')`);
  db.exec(`INSERT OR IGNORE INTO job_responsibilities (position_id, content, weight, kpi_criteria) VALUES (2, '参与数据库设计', 20, '设计方案评审通过')`);
  db.exec(`INSERT OR IGNORE INTO job_responsibilities (position_id, content, weight, kpi_criteria) VALUES (2, '保证服务稳定性', 25, '服务可用率 >= 99.9%')`);
  db.exec(`INSERT OR IGNORE INTO job_responsibilities (position_id, content, weight, kpi_criteria) VALUES (2, '代码Review', 25, 'Review及时率 >= 95%')`);
} catch (e) {}

// 插入示例题目
try {
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', '以下哪项是JavaScript的基本数据类型？', '["String", "Array", "Object", "Function"]', '["String"]', '前端')`);
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', 'React中用于管理状态的Hook是？', '["useEffect", "useState", "useRef", "useContext"]', '["useState"]', '前端')`);
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', '以下哪个HTTP状态码表示成功？', '["200", "404", "500", "301"]', '["200"]', '后端')`);
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', 'SQL中用于查询数据的语句是？', '["INSERT", "UPDATE", "SELECT", "DELETE"]', '["SELECT"]', '后端')`);
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', 'RESTful API中GET方法通常用于？', '["创建资源", "更新资源", "查询资源", "删除资源"]', '["查询资源"]', '后端')`);
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', '以下哪个是CSS选择器？', '["function", "class", "variable", "loop"]', '["class"]', '前端')`);
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', 'Node.js的异步编程常使用？', '["callback", "promise", "async/await", "全部都是"]', '["全部都是"]', '后端')`);
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', 'Git中用于查看提交历史的命令是？', '["git status", "git log", "git branch", "git diff"]', '["git log"]', '通用')`);
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', '以下哪个是前端框架？', '["Django", "Spring", "React", "Laravel"]', '["React"]', '前端')`);
  db.exec(`INSERT OR IGNORE INTO question_bank (type, content, options, correct_answer, category) VALUES ('single', '数据库索引的主要作用是？', '["增加存储空间", "加快查询速度", "保证数据安全", "格式化数据"]', '["加快查询速度"]', '后端')`);
} catch (e) {}

console.log('数据库初始化完成！');
console.log('默认管理员账号: admin / admin123');

// 添加 sqlite3 兼容方法
db.run = function(sql, params, callback) {
  try {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
      stmt.run(...params);
    } else {
      stmt.run();
    }
    if (callback) {
      callback.call({ lastID: stmt.lastInsertRowid, changes: stmt.changes }, null);
    }
  } catch (err) {
    if (callback) {
      callback(err);
    }
  }
};

db.get = function(sql, params, callback) {
  try {
    const stmt = db.prepare(sql);
    let result;
    if (params && params.length > 0) {
      result = stmt.get(...params);
    } else {
      result = stmt.get();
    }
    if (callback) {
      callback(null, result);
    }
  } catch (err) {
    if (callback) {
      callback(err);
    }
  }
};

db.all = function(sql, params, callback) {
  try {
    const stmt = db.prepare(sql);
    let result;
    if (params && params.length > 0) {
      result = stmt.all(...params);
    } else {
      result = stmt.all();
    }
    if (callback) {
      callback(null, result);
    }
  } catch (err) {
    if (callback) {
      callback(err);
    }
  }
};

module.exports = db;
