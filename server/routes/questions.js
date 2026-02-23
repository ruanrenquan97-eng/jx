const express = require('express');
const db = require('../database');

const router = express.Router();

// 获取题库列表
router.get('/', (req, res) => {
  const { category, type, page = 1, pageSize = 20 } = req.query;
  let sql = `SELECT * FROM question_bank WHERE 1=1`;
  const params = [];
  
  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }
  if (type) {
    sql += ` AND type = ?`;
    params.push(type);
  }
  
  const offset = (page - 1) * pageSize;
  sql += ` ORDER BY id LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), parseInt(offset));
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取题库失败' });
    }
    
    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM question_bank WHERE 1=1`;
    const countParams = [];
    if (category) {
      countSql += ` AND category = ?`;
      countParams.push(category);
    }
    if (type) {
      countSql += ` AND type = ?`;
      countParams.push(type);
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

// 获取单个题目
router.get('/:id', (req, res) => {
  const sql = `SELECT * FROM question_bank WHERE id = ?`;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取题目详情失败' });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: '题目不存在' });
    }
    res.json({ success: true, data: row });
  });
});

// 添加题目
router.post('/', (req, res) => {
  const { type, content, options, correct_answer, category, difficulty } = req.body;
  
  if (!type || !content || !correct_answer) {
    return res.status(400).json({ success: false, message: '题型、题干和正确答案不能为空' });
  }

  const sql = `INSERT INTO question_bank (type, content, options, correct_answer, category, difficulty) VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [type, content, JSON.stringify(options), JSON.stringify(correct_answer), category, difficulty || 'medium'], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '添加题目失败', error: err.message });
    }
    res.json({ success: true, message: '添加成功', data: { id: this.lastID } });
  });
});

// 更新题目
router.put('/:id', (req, res) => {
  const { type, content, options, correct_answer, category, difficulty } = req.body;
  
  const sql = `UPDATE question_bank SET type = ?, content = ?, options = ?, correct_answer = ?, category = ?, difficulty = ? WHERE id = ?`;
  
  db.run(sql, [type, content, JSON.stringify(options), JSON.stringify(correct_answer), category, difficulty, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '更新题目失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '题目不存在' });
    }
    res.json({ success: true, message: '更新成功' });
  });
});

// 删除题目
router.delete('/:id', (req, res) => {
  const sql = `DELETE FROM question_bank WHERE id = ?`;
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '删除题目失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '题目不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  });
});

// 随机获取题目（用于考试）
router.get('/random/:count', (req, res) => {
  const { category } = req.query;
  const count = parseInt(req.params.count) || 10;
  
  let sql = `SELECT id, type, content, options FROM question_bank`;
  const params = [];
  
  if (category) {
    sql += ` WHERE category = ?`;
    params.push(category);
  }
  
  sql += ` ORDER BY RANDOM() LIMIT ?`;
  params.push(count);
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取随机题目失败' });
    }
    // 解析options
    const questions = rows.map(row => ({
      ...row,
      options: JSON.parse(row.options || '[]')
    }));
    res.json({ success: true, data: questions });
  });
});

module.exports = router;
