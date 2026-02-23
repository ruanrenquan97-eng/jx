const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// 引入路由
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const positionRoutes = require('./routes/positions');
const responsibilityRoutes = require('./routes/responsibilities');
const examRoutes = require('./routes/exams');
const questionRoutes = require('./routes/questions');
const feishuRoutes = require('./routes/feishu');
const performanceRoutes = require('./routes/performance');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/responsibilities', responsibilityRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/feishu', feishuRoutes);
app.use('/api/performance', performanceRoutes);

// 用户相关路由
app.use('/api/users', require('./routes/users'));

// 考试记录路由
app.use('/api/exam-records', require('./routes/examRecords'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '绩效管理系统 API 运行中' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Vercel serverless export
module.exports = app;

// 本地运行
if (process.env.VERCEL !== 'true') {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}
