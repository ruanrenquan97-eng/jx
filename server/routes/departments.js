const express = require('express');
const db = require('../database');

const router = express.Router();

// 获取部门列表
router.get('/', (req, res) => {
  const sql = `
    SELECT d.*, u.username as manager_name, p.name as parent_name
    FROM departments d
    LEFT JOIN users u ON d.manager_id = u.id
    LEFT JOIN departments p ON d.parent_id = p.id
    ORDER BY d.id
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取部门列表失败' });
    }
    res.json({ success: true, data: rows });
  });
});

// 获取部门详情
router.get('/:id', (req, res) => {
  const sql = `
    SELECT d.*, u.username as manager_name
    FROM departments d
    LEFT JOIN users u ON d.manager_id = u.id
    WHERE d.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取部门详情失败' });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: '部门不存在' });
    }
    res.json({ success: true, data: row });
  });
});

// 创建部门
router.post('/', (req, res) => {
  const { name, manager_id, parent_id } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '部门名称不能为空' });
  }

  const sql = `INSERT INTO departments (name, manager_id, parent_id) VALUES (?, ?, ?)`;
  
  db.run(sql, [name, manager_id, parent_id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '创建部门失败', error: err.message });
    }
    res.json({ success: true, message: '创建成功', data: { id: this.lastID } });
  });
});

// 更新部门
router.put('/:id', (req, res) => {
  const { name, manager_id, parent_id } = req.body;
  
  const sql = `UPDATE departments SET name = ?, manager_id = ?, parent_id = ? WHERE id = ?`;
  
  db.run(sql, [name, manager_id, parent_id, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: '更新部门失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '部门不存在' });
    }
    res.json({ success: true, message: '更新成功' });
  });
});

// 删除部门
router.delete('/:id', (req, res) => {
  const sql = `DELETE FROM departments WHERE id = ?`;
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
    return res.status(500).json({ success: false, message: '删除部门失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: '部门不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  });
});

// 获取部门员工
router.get('/:id/users', (req, res) => {
  const sql = `
    SELECT u.id, u.username, u.email, u.phone, u.role, p.name as position_name
    FROM users u
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE u.department_id = ?
  `;
  
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取员工列表失败' });
    }
    res.json({ success: true, data: rows });
  });
});

module.exports = router;
