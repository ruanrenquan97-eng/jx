const express = require('express');
const db = require('../database');

const router = express.Router();

// 获取岗位列表
router.get('/', (req, res) => {
  const { department_id } = req.query;
  let sql = `
    SELECT p.*, d.name as department_name
    FROM positions p
    LEFT JOIN departments d ON p.department_id = d.id
  `;
  
  const params = [];
  if (department_id) {
    sql += ' WHERE p.department_id = ?';
    params.push(department_id);
  }
  
  sql += ' ORDER BY p.id';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取岗位列表失败' });
    }
    res.json({ success: true, data: rows });
  });
});

// 获取岗位详情
router.get('/:id', (req, res) => {
  const sql = `
    SELECT p.*, d.name as department_name
    FROM positions p
    LEFT JOIN departments d ON p.department_id = d.id
    WHERE p.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取岗位详情失败' });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: '岗位不存在' });
    }
    res.json({ success: true, data: row });
  });
});

// 创建岗位
router.post('/', (req, res) => {
  const { name, level, department_id } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '岗位名称不能为空' });
  }

  const sql = `INSERT INTO positions (name, level, department_id) VALUES (?, ?, ?)`;
  
  db.run(sql, [name, level || 1, department_id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '创建岗位失败', error: err.message });
    }
    res.json({ success: true, message: '创建成功', data: { id: this.lastID } });
  });
});

// 更新岗位
router.put('/:id', (req, res) => {
  const { name, level, department_id } = req.body;
  
  const sql = `UPDATE positions SET name = ?, level = ?, department_id = ? WHERE id = ?`;
  
  db.run(sql, [name, level, department_id, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '更新岗位失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '岗位不存在' });
    }
    res.json({ success: true, message: '更新成功' });
  });
});

// 删除岗位
router.delete('/:id', (req, res) => {
  const sql = `DELETE FROM positions WHERE id = ?`;
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '删除岗位失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '岗位不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  });
});

module.exports = router;
