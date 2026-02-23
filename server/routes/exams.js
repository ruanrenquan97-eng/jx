const express = require('express');
const db = require('../database');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'performance-system-secret-key';

// 获取考试列表
router.get('/', (req, res) => {
  const { status, position_id, page = 1, pageSize = 10 } = req.query;
  let sql = `
    SELECT e.*, p.name as position_name
    FROM exams e
    LEFT JOIN positions p ON e.target_position_id = p.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ` AND e.status = ?`;
    params.push(status);
  }
  if (position_id) {
    sql += ` AND e.target_position_id = ?`;
    params.push(position_id);
  }
  
  sql += ` ORDER BY e.start_time DESC`;
  const offset = (page - 1) * pageSize;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), parseInt(offset));
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取考试列表失败' });
    }
    
    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM exams WHERE 1=1`;
    const countParams = [];
    if (status) {
      countSql += ` AND status = ?`;
      countParams.push(status);
    }
    if (position_id) {
      countSql += ` AND target_position_id = ?`;
      countParams.push(position_id);
    }
    
    db.get(countSql, countParams, (err, countResult) => {
      res.json({ 
        success: true, 
        data: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult.total
        }
      });
    });
  });
});

// 获取当前用户的可参加考试
router.get('/available', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const sql = `
      SELECT e.*, p.name as position_name
      FROM exams e
      LEFT JOIN positions p ON e.target_position_id = p.id
      WHERE e.status = 'active' 
        AND datetime('now') BETWEEN e.start_time AND e.end_time
        AND (e.target_position_id IS NULL OR e.target_position_id = (
          SELECT position_id FROM users WHERE id = ?
        ))
      ORDER BY e.start_time DESC
    `;
    
    db.all(sql, [decoded.id], (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: '获取考试列表失败' });
      }
      res.json({ success: true, data: rows });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 获取考试详情
router.get('/:id', (req, res) => {
  const sql = `
    SELECT e.*, p.name as position_name
    FROM exams e
    LEFT JOIN positions p ON e.target_position_id = p.id
    WHERE e.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取考试详情失败' });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: '考试不存在' });
    }
    res.json({ success: true, data: row });
  });
});

// 获取考试题目（开始考试）
router.get('/:id/questions', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 检查是否已经参加过考试
    const checkSql = `SELECT * FROM exam_records WHERE user_id = ? AND exam_id = ? AND status = 'completed'`;
    db.get(checkSql, [decoded.id, req.params.id], (err, existing) => {
      if (existing) {
        return res.status(400).json({ success: false, message: '您已完成此考试' });
      }
      
      // 获取考试信息
      db.get('SELECT * FROM exams WHERE id = ?', [req.params.id], (err, exam) => {
        if (err || !exam) {
          return res.status(404).json({ success: false, message: '考试不存在' });
        }
        
        // 检查考试是否在有效期内
        const now = new Date();
        const start = new Date(exam.start_time);
        const end = new Date(exam.end_time);
        
        if (now < start || now > end) {
          return res.status(400).json({ success: false, message: '考试不在开放时间内' });
        }
        
        // 获取或创建考试记录
        let recordSql = `SELECT * FROM exam_records WHERE user_id = ? AND exam_id = ?`;
        db.get(recordSql, [decoded.id, req.params.id], (err, record) => {
          if (!record) {
            // 创建新的考试记录
            const insertSql = `INSERT INTO exam_records (user_id, exam_id, status) VALUES (?, ?, 'in_progress')`;
            db.run(insertSql, [decoded.id, req.params.id], function(err) {
              if (err) {
                return res.status(500).json({ success: false, message: '创建考试记录失败' });
              }
              getQuestions();
            });
          } else {
            getQuestions();
          }
        });
        
        function getQuestions() {
          // 从题库获取题目
          let sql = `SELECT id, type, content, options FROM question_bank`;
          const params = [];
          
          if (exam.target_position_id) {
            sql += ` WHERE category = (SELECT p.name FROM positions p WHERE p.id = ?)`;
            params.push(exam.target_position_id);
          }
          
          sql += ` ORDER BY RANDOM() LIMIT ?`;
          params.push(exam.question_count);
          
          db.all(sql, params, (err, rows) => {
            if (err) {
              return res.status(500).json({ success: false, message: '获取题目失败' });
            }
            
            const questions = rows.map(row => ({
              ...row,
              options: JSON.parse(row.options || '[]')
            }));
            
            res.json({ 
              success: true, 
              data: {
                exam,
                questions,
                duration: exam.duration_minutes
              }
            });
          });
        }
      });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 提交试卷
router.post('/:id/submit', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { answers } = req.body;
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 获取考试题目和正确答案
    db.get('SELECT * FROM exams WHERE id = ?', [req.params.id], (err, exam) => {
      if (err || !exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 获取题目
      let sql = `SELECT * FROM question_bank`;
      const params = [];
      
      if (exam.target_position_id) {
        sql += ` WHERE category = (SELECT p.name FROM positions p WHERE p.id = ?)`;
        params.push(exam.target_position_id);
      }
      
      sql += ` ORDER BY RANDOM() LIMIT ?`;
      params.push(exam.question_count);
      
      db.all(sql, params, (err, questions) => {
        if (err) {
          return res.status(500).json({ success: false, message: '获取题目失败' });
        }
        
        // 计算分数
        let correctCount = 0;
        questions.forEach(question => {
          const correctAnswer = JSON.parse(question.correct_answer || '[]');
          const userAnswer = answers[question.id];
          
          if (userAnswer) {
            const userAnswerSorted = [...userAnswer].sort();
            const correctAnswerSorted = [...correctAnswer].sort();
            
            if (JSON.stringify(userAnswerSorted) === JSON.stringify(correctAnswerSorted)) {
              correctCount++;
            }
          }
        });
        
        const score = (correctCount / questions.length) * exam.total_score;
        
        // 更新考试记录
        const updateSql = `
          UPDATE exam_records 
          SET score = ?, answers = ?, submit_time = CURRENT_TIMESTAMP, status = 'completed'
          WHERE user_id = ? AND exam_id = ?
        `;
        
        db.run(updateSql, [score, JSON.stringify(answers), decoded.id, req.params.id], function(err) {
          if (err) {
            return res.status(500).json({ success: false, message: '提交试卷失败' });
          }
          
          res.json({ 
            success: true, 
            message: '提交成功',
            data: {
              score: score.toFixed(2),
              correctCount,
              totalCount: questions.length
            }
          });
        });
      });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 创建考试
router.post('/', (req, res) => {
  const { title, description, start_time, end_time, duration_minutes, target_position_id, question_count, total_score } = req.body;
  
  if (!title || !start_time || !end_time) {
    return res.status(400).json({ success: false, message: '考试标题、开始时间和结束时间不能为空' });
  }

  const sql = `
    INSERT INTO exams (title, description, start_time, end_time, duration_minutes, target_position_id, question_count, total_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;
  
  db.run(sql, [title, description, start_time, end_time, duration_minutes || 60, target_position_id, question_count || 10, total_score || 100], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '创建考试失败', error: err.message });
    }
    res.json({ success: true, message: '创建成功', data: { id: this.lastID } });
  });
});

// 更新考试
router.put('/:id', (req, res) => {
  const { title, description, start_time, end_time, duration_minutes, target_position_id, question_count, total_score, status } = req.body;
  
  const sql = `
    UPDATE exams 
    SET title = ?, description = ?, start_time = ?, end_time = ?, duration_minutes = ?, 
        target_position_id = ?, question_count = ?, total_score = ?, status = ?
    WHERE id = ?
  `;
  
  db.run(sql, [title, description, start_time, end_time, duration_minutes, target_position_id, 
    question_count, total_score, status, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '更新考试失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '考试不存在' });
    }
    res.json({ success: true, message: '更新成功' });
  });
});

// 删除考试
router.delete('/:id', (req, res) => {
  const sql = `DELETE FROM exams WHERE id = ?`;
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '删除考试失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '考试不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  });
});

module.exports = router;
