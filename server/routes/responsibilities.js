const express = require('express');
const db = require('../database');

const router = express.Router();

// 获取岗位职责列表
router.get('/', (req, res) => {
  const { position_id } = req.query;
  let sql = `
    SELECT r.*, p.name as position_name
    FROM job_responsibilities r
    LEFT JOIN positions p ON r.position_id = p.id
  `;
  
  const params = [];
  if (position_id) {
    sql += ' WHERE r.position_id = ?';
    params.push(position_id);
  }
  
  sql += ' ORDER BY r.position_id, r.id';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取岗位职责列表失败' });
    }
    res.json({ success: true, data: rows });
  });
});

// 获取单个岗位职责
router.get('/:id', (req, res) => {
  const sql = `
    SELECT r.*, p.name as position_name
    FROM job_responsibilities r
    LEFT JOIN positions p ON r.position_id = p.id
    WHERE r.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取岗位职责详情失败' });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: '岗位职责不存在' });
    }
    res.json({ success: true, data: row });
  });
});

// 创建岗位职责
router.post('/', (req, res) => {
  const { position_id, content, weight, kpi_criteria } = req.body;
  
  if (!position_id || !content) {
    return res.status(400).json({ success: false, message: '岗位ID和职责内容不能为空' });
  }

  const sql = `INSERT INTO job_responsibilities (position_id, content, weight, kpi_criteria) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [position_id, content, weight || 10, kpi_criteria], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '创建岗位职责失败', error: err.message });
    }
    res.json({ success: true, message: '创建成功', data: { id: this.lastID } });
  });
});

// 更新岗位职责
router.put('/:id', (req, res) => {
  const { content, weight, kpi_criteria } = req.body;
  
  const sql = `UPDATE job_responsibilities SET content = ?, weight = ?, kpi_criteria = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  
  db.run(sql, [content, weight, kpi_criteria, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '更新岗位职责失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '岗位职责不存在' });
    }
    res.json({ success: true, message: '更新成功' });
  });
});

// 删除岗位职责
router.delete('/:id', (req, res) => {
  const sql = `DELETE FROM job_responsibilities WHERE id = ?`;
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '删除岗位职责失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '岗位职责不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  });
});

// 获取员工对应的岗位职责
router.get('/employee/:userId', (req, res) => {
  const sql = `
    SELECT r.*, p.name as position_name
    FROM job_responsibilities r
    LEFT JOIN positions p ON r.position_id = p.id
    WHERE r.position_id = (
      SELECT position_id FROM users WHERE id = ?
    )
    ORDER BY r.id
  `;
  
  db.all(sql, [req.params.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取员工岗位职责失败' });
    }
    res.json({ success: true, data: rows });
  });
});

module.exports = router;
