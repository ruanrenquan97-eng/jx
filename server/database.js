const bcrypt = require('bcryptjs');

// 内存数据库
const db = {
  users: [],
  departments: [],
  positions: [],
  job_responsibilities: [],
  question_bank: [],
  exams: [],
  exam_records: [],
  feishu_reports: [],
  performance_reviews: [],
  feishu_config: []
};

// 初始化数据
function initDatabase() {
  // 默认管理员
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.users.push({
    id: 1,
    username: 'admin',
    password: adminPassword,
    email: 'admin@company.com',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString()
  });

  // 示例部门
  db.departments = [
    { id: 1, name: '技术部', created_at: new Date().toISOString() },
    { id: 2, name: '产品部', created_at: new Date().toISOString() },
    { id: 3, name: '运营部', created_at: new Date().toISOString() },
    { id: 4, name: '市场部', created_at: new Date().toISOString() }
  ];

  // 示例岗位
  db.positions = [
    { id: 1, name: '前端开发工程师', department_id: 1, created_at: new Date().toISOString() },
    { id: 2, name: '后端开发工程师', department_id: 1, created_at: new Date().toISOString() },
    { id: 3, name: '产品经理', department_id: 2, created_at: new Date().toISOString() },
    { id: 4, name: '运营专员', department_id: 3, created_at: new Date().toISOString() },
    { id: 5, name: '市场专员', department_id: 4, created_at: new Date().toISOString() }
  ];

  // 示例岗位职责
  db.job_responsibilities = [
    { id: 1, position_id: 1, content: '按时完成前端页面开发', weight: 30, kpi_criteria: '代码质量评分 >= 80', created_at: new Date().toISOString() },
    { id: 2, position_id: 1, content: '参与技术方案评审', weight: 20, kpi_criteria: '评审会议参与率 >= 90%', created_at: new Date().toISOString() },
    { id: 3, position_id: 1, content: '保证代码规范和文档更新', weight: 25, kpi_criteria: '文档完整性评分 >= 85', created_at: new Date().toISOString() },
    { id: 4, position_id: 1, content: '及时响应线上问题', weight: 25, kpi_criteria: '问题响应时间 <= 2小时', created_at: new Date().toISOString() },
    { id: 5, position_id: 2, content: '完成API接口开发', weight: 30, kpi_criteria: '接口测试通过率100%', created_at: new Date().toISOString() },
    { id: 6, position_id: 2, content: '参与数据库设计', weight: 20, kpi_criteria: '设计方案评审通过', created_at: new Date().toISOString() },
    { id: 7, position_id: 2, content: '保证服务稳定性', weight: 25, kpi_criteria: '服务可用率 >= 99.9%', created_at: new Date().toISOString() },
    { id: 8, position_id: 2, content: '代码Review', weight: 25, kpi_criteria: 'Review及时率 >= 95%', created_at: new Date().toISOString() }
  ];

  // 示例题目
  db.question_bank = [
    { id: 1, type: 'single', content: '以下哪项是JavaScript的基本数据类型？', options: '["String", "Array", "Object", "Function"]', correct_answer: '["String"]', category: '前端', created_at: new Date().toISOString() },
    { id: 2, type: 'single', content: 'React中用于管理状态的Hook是？', options: '["useEffect", "useState", "useRef", "useContext"]', correct_answer: '["useState"]', category: '前端', created_at: new Date().toISOString() },
    { id: 3, type: 'single', content: '以下哪个HTTP状态码表示成功？', options: '["200", "404", "500", "301"]', correct_answer: '["200"]', category: '后端', created_at: new Date().toISOString() },
    { id: 4, type: 'single', content: 'SQL中用于查询数据的语句是？', options: '["INSERT", "UPDATE", "SELECT", "DELETE"]', correct_answer: '["SELECT"]', category: '后端', created_at: new Date().toISOString() },
    { id: 5, type: 'single', content: 'RESTful API中GET方法通常用于？', options: '["创建资源", "更新资源", "查询资源", "删除资源"]', correct_answer: '["查询资源"]', category: '后端', created_at: new Date().toISOString() },
    { id: 6, type: 'single', content: '以下哪个是CSS选择器？', options: '["function", "class", "variable", "loop"]', correct_answer: '["class"]', category: '前端', created_at: new Date().toISOString() },
    { id: 7, type: 'single', content: 'Node.js的异步编程常使用？', options: '["callback", "promise", "async/await", "全部都是"]', correct_answer: '["全部都是"]', category: '后端', created_at: new Date().toISOString() },
    { id: 8, type: 'single', content: 'Git中用于查看提交历史的命令是？', options: '["git status", "git log", "git branch", "git diff"]', correct_answer: '["git log"]', category: '通用', created_at: new Date().toISOString() },
    { id: 9, type: 'single', content: '以下哪个是前端框架？', options: '["Django", "Spring", "React", "Laravel"]', correct_answer: '["React"]', category: '前端', created_at: new Date().toISOString() },
    { id: 10, type: 'single', content: '数据库索引的主要作用是？', options: '["增加存储空间", "加快查询速度", "保证数据安全", "格式化数据"]', correct_answer: '["加快查询速度"]', category: '后端', created_at: new Date().toISOString() }
  ];

  console.log('数据库初始化完成！');
  console.log('默认管理员账号: admin / admin123');
}

// 初始化
initDatabase();

// 获取下一个ID
function getNextId(table) {
  if (db[table].length === 0) return 1;
  return Math.max(...db[table].map(item => item.id)) + 1;
}

// 模拟SQL的db.run
db.run = function(sql, params, callback) {
  // 解析SQL并执行
  setTimeout(() => {
    if (callback) callback.call({ lastID: 0, changes: 0 }, null);
  }, 0);
};

// 模拟SQL的db.get
db.get = function(sql, params, callback) {
  setTimeout(() => {
    if (callback) callback(null, null);
  }, 0);
};

// 模拟SQL的db.all
db.all = function(sql, params, callback) {
  setTimeout(() => {
    if (callback) callback(null, []);
  }, 0);
};

module.exports = db;
