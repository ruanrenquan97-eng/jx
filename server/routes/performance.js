const express = require('express');
const db = require('../database');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'performance-system-secret-key';

// 获取绩效列表
router.get('/', (req, res) => {
  const { user_id, cycle, status, page = 1, pageSize = 10 } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  let sql = `
    SELECT p.*, u.username, u.email, d.name as department_name, pos.name as position_name
    FROM performance_reviews p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions pos ON u.position_id = pos.id
    WHERE 1=1
  `;
  const params = [];
  
  // 权限控制
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'employee') {
        sql += ` AND p.user_id = ?`;
        params.push(decoded.id);
      } else if (decoded.role === 'manager') {
        // 经理只能看到本部门的
        sql += ` AND u.department_id = (SELECT department_id FROM users WHERE id = ?)`;
        params.push(decoded.id);
      }
    } catch (e) {
      // token无效，继续（但可能没有权限）
    }
  }
  
  if (user_id) {
    sql += ` AND p.user_id = ?`;
    params.push(user_id);
  }
  if (cycle) {
    sql += ` AND p.cycle = ?`;
    params.push(cycle);
  }
  if (status) {
    sql += ` AND p.status = ?`;
    params.push(status);
  }
  
  sql += ` ORDER BY p.created_at DESC`;
  const offset = (page - 1) * pageSize;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), parseInt(offset));
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取绩效列表失败' });
    }
    res.json({ success: true, data: rows });
  });
});

// 获取当前用户的绩效
router.get('/my', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const sql = `
      SELECT p.*, u.username
      FROM performance_reviews p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.cycle DESC
    `;
    
    db.all(sql, [decoded.id], (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: '获取绩效失败' });
      }
      res.json({ success: true, data: rows });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 获取单个绩效详情
router.get('/:id', (req, res) => {
  const sql = `
    SELECT p.*, u.username, u.email, d.name as department_name, pos.name as position_name
    FROM performance_reviews p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions pos ON u.position_id = pos.id
    WHERE p.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取绩效详情失败' });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: '绩效记录不存在' });
    }
    res.json({ success: true, data: row });
  });
});

// 计算绩效
router.post('/calculate', (req, res) => {
  const { user_id, cycle } = req.body;
  
  if (!user_id || !cycle) {
    return res.status(400).json({ success: false, message: '用户ID和考核周期不能为空' });
  }

  // 获取用户信息
  db.get('SELECT position_id FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 1. 获取考试分数
    const examSql = `
      SELECT AVG(score) as avg_score 
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.id
      WHERE er.user_id = ? 
        AND er.status = 'completed'
        AND strftime('%Y-%m', er.submit_time) = ?
    `;
    
    db.get(examSql, [user_id, cycle], (err, examResult) => {
      const examScore = examResult?.avg_score || 0;
      
      // 2. 获取岗位职责考核分（这里简化为职责完成度，默认80分）
      const respSql = `SELECT SUM(weight) as total_weight FROM job_responsibilities WHERE position_id = ?`;
      db.get(respSql, [user.position_id], (err, respResult) => {
        const kpiScore = 80; // 简化处理，实际应该由经理评分
        
        // 3. 获取日报完成率
        const reportSql = `
          SELECT COUNT(*) as total_days,
                 (SELECT COUNT(*) FROM feishu_reports WHERE user_id = ? AND report_date LIKE ?) as submitted_days
          FROM (
            SELECT date('now', '-' || generate_series || ' days') as day
            FROM generate_series(0, 29)
          )
        `;
        
        const reportDatePrefix = cycle + '%';
        db.get(reportSql, [user_id, reportDatePrefix], (err, reportResult) => {
          const dailyLogScore = reportResult?.total_days > 0 
            ? (reportResult.submitted_days / reportResult.total_days) * 100 
            : 0;
          
          // 计算最终分数
          const finalScore = (examScore * 0.3) + (kpiScore * 0.5) + (dailyLogScore * 0.2);
          
          // 检查是否已存在绩效记录
          db.get('SELECT id FROM performance_reviews WHERE user_id = ? AND cycle = ?', [user_id, cycle], (err, existing) => {
            if (existing) {
              // 更新
              const updateSql = `
                UPDATE performance_reviews 
                SET exam_score = ?, kpi_score = ?, daily_log_score = ?, final_score = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
              `;
              db.run(updateSql, [examScore, kpiScore, dailyLogScore, finalScore, existing.id], (err) => {
                if (err) {
                  return res.status(500).json({ success: false, message: '更新绩效失败' });
                }
                res.json({ success: true, message: '绩效计算完成', data: { examScore, kpiScore, dailyLogScore, finalScore } });
              });
            } else {
              // 创建
              const insertSql = `
                INSERT INTO performance_reviews (user_id, cycle, exam_score, kpi_score, daily_log_score, final_score, status)
                VALUES (?, ?, ?, ?, ?, ?, 'draft')
              `;
              db.run(insertSql, [user_id, cycle, examScore, kpiScore, dailyLogScore, finalScore], function(err) {
                if (err) {
                  return res.status(500).json({ success: false, message: '创建绩效记录失败' });
                }
                res.json({ success: true, message: '绩效计算完成', data: { examScore, kpiScore, dailyLogScore, finalScore } });
              });
            }
          });
        });
      });
    });
  });
});

// 批量计算绩效（管理员）
router.post('/calculate-batch', (req, res) => {
  const { cycle } = req.body;
  
  if (!cycle) {
    return res.status(400).json({ success: false, message: '考核周期不能为空' });
  }

  // 获取所有用户
  db.all('SELECT id FROM users WHERE status = "active"', [], (err, users) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取用户列表失败' });
    }
    
    let processed = 0;
    const results = [];
    
    users.forEach(user => {
      // 为每个用户计算绩效
      const examSql = `
        SELECT AVG(score) as avg_score 
        FROM exam_records er
        JOIN exams e ON er.exam_id = e.id
        WHERE er.user_id = ? 
          AND er.status = 'completed'
          AND strftime('%Y-%m', er.submit_time) = ?
      `;
      
      db.get(examSql, [user.id, cycle], (err, examResult) => {
        const examScore = examResult?.avg_score || 0;
        const kpiScore = 80; // 简化
        const dailyLogScore = 85; // 简化
        
        const finalScore = (examScore * 0.3) + (kpiScore * 0.5) + (dailyLogScore * 0.2);
        
        db.get('SELECT id FROM performance_reviews WHERE user_id = ? AND cycle = ?', [user.id, cycle], (err, existing) => {
          if (existing) {
            db.run('UPDATE performance_reviews SET exam_score = ?, kpi_score = ?, daily_log_score = ?, final_score = ? WHERE id = ?',
              [examScore, kpiScore, dailyLogScore, finalScore, existing.id], (err) => {
                processed++;
                results.push({ user_id: user.id, status: 'updated' });
                if (processed === users.length) {
                  res.json({ success: true, message: `批量计算完成，共处理 ${processed} 个用户`, data: results });
                }
              });
          } else {
            db.run('INSERT INTO performance_reviews (user_id, cycle, exam_score, kpi_score, daily_log_score, final_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [user.id, cycle, examScore, kpiScore, dailyLogScore, finalScore, 'draft'], (err) => {
                processed++;
                results.push({ user_id: user.id, status: 'created' });
                if (processed === users.length) {
                  res.json({ success: true, message: `批量计算完成，共处理 ${processed} 个用户`, data: results });
                }
              });
          }
        });
      });
    });
  });
});

// 更新绩效状态
router.put('/:id', (req, res) => {
  const { manager_comment, status } = req.body;
  
  const sql = `UPDATE performance_reviews SET manager_comment = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  
  db.run(sql, [manager_comment, status, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '更新绩效失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '绩效记录不存在' });
    }
    res.json({ success: true, message: '更新成功' });
  });
});

module.exports = router;
