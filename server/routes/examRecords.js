const express = require('express');
const db = require('../database');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'performance-system-secret-key';

// 获取考试记录列表
router.get('/', (req, res) => {
  const { exam_id, user_id, status, page = 1, pageSize = 20 } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    let sql = `
      SELECT er.*, u.username, e.title as exam_title
      FROM exam_records er
      LEFT JOIN users u ON er.user_id = u.id
      LEFT JOIN exams e ON er.exam_id = e.id
      WHERE 1=1
    `;
    const params = [];
    
    // 权限控制
    if (decoded.role === 'employee') {
      sql += ` AND er.user_id = ?`;
      params.push(decoded.id);
    } else if (decoded.role === 'manager') {
      sql += ` AND u.department_id = (SELECT department_id FROM users WHERE id = ?)`;
      params.push(decoded.id);
    }
    
    if (exam_id) {
      sql += ` AND er.exam_id = ?`;
      params.push(exam_id);
    }
    if (user_id) {
      sql += ` AND er.user_id = ?`;
      params.push(user_id);
    }
    if (status) {
      sql += ` AND er.status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY er.created_at DESC`;
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), parseInt(offset));
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: '获取考试记录失败' });
      }
      
      // 解析答案JSON
      const data = rows.map(row => ({
        ...row,
        answers: row.answers ? JSON.parse(row.answers) : null
      }));
      
      res.json({ success: true, data });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 获取单个考试记录
router.get('/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const sql = `
      SELECT er.*, u.username, e.title as exam_title, e.total_score
      FROM exam_records er
      LEFT JOIN users u ON er.user_id = u.id
      LEFT JOIN exams e ON er.exam_id = e.id
      WHERE er.id = ?
    `;
    
    db.get(sql, [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: '获取考试记录失败' });
      }
      if (!row) {
        return res.status(404).json({ success: false, message: '考试记录不存在' });
      }
      
      // 权限检查
      if (decoded.role === 'employee' && row.user_id !== decoded.id) {
        return res.status(403).json({ success: false, message: '没有权限' });
      }
      
      // 解析答案
      const answers = row.answers ? JSON.parse(row.answers) : null;
      
      // 获取题目和正确答案
      if (row.exam_id && answers) {
        const questionIds = Object.keys(answers);
        if (questionIds.length > 0) {
          db.all(`SELECT id, content, options, correct_answer FROM question_bank WHERE id IN (${questionIds.join(',')})`, [], (err, questions) => {
            const questionMap = {};
            questions.forEach(q => {
              questionMap[q.id] = {
                ...q,
                correct_answer: JSON.parse(q.correct_answer || '[]'),
                options: JSON.parse(q.options || '[]')
              };
            });
            
            res.json({ 
              success: true, 
              data: {
                ...row,
                answers,
                questions: questionMap
              }
            });
          });
        } else {
          res.json({ success: true, data: { ...row, answers } });
        }
      } else {
        res.json({ success: true, data: { ...row, answers } });
      }
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 获取当前用户的考试统计
router.get('/stats/my', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 总考试次数
    const totalSql = `SELECT COUNT(*) as total FROM exam_records WHERE user_id = ?`;
    db.get(totalSql, [decoded.id], (err, totalResult) => {
      // 完成次数
      const completedSql = `SELECT COUNT(*) as completed FROM exam_records WHERE user_id = ? AND status = 'completed'`;
      db.get(completedSql, [decoded.id], (err, completedResult) => {
        // 平均分
        const avgSql = `SELECT AVG(score) as avg_score FROM exam_records WHERE user_id = ? AND status = 'completed'`;
        db.get(avgSql, [decoded.id], (err, avgResult) => {
          // 最近5次考试
          const recentSql = `
            SELECT er.*, e.title
            FROM exam_records er
            LEFT JOIN exams e ON er.exam_id = e.id
            WHERE er.user_id = ? AND er.status = 'completed'
            ORDER BY er.submit_time DESC
            LIMIT 5
          `;
          db.all(recentSql, [decoded.id], (err, recentRows) => {
            res.json({
              success: true,
              data: {
                totalExams: totalResult?.total || 0,
                completedExams: completedResult?.completed || 0,
                averageScore: avgResult?.avg_score ? parseFloat(avgResult.avg_score).toFixed(2) : 0,
                recentExams: recentRows
              }
            });
          });
        });
      });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

module.exports = router;
