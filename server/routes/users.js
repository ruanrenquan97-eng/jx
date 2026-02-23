const express = require('express');
const db = require('../database');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'performance-system-secret-key';

// 获取用户列表
router.get('/', (req, res) => {
  const { department_id, position_id, role, page = 1, pageSize = 20 } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // 权限检查
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 普通员工只能看到自己
    if (decoded.role === 'employee') {
      return res.json({ 
        success: true, 
        data: [{
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        }]
      });
    }
    
    let sql = `
      SELECT u.id, u.username, u.email, u.phone, u.role, u.status, u.department_id, u.position_id,
             d.name as department_name, p.name as position_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN positions p ON u.position_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (department_id) {
      sql += ` AND u.department_id = ?`;
      params.push(department_id);
    }
    if (position_id) {
      sql += ` AND u.position_id = ?`;
      params.push(position_id);
    }
    if (role) {
      sql += ` AND u.role = ?`;
      params.push(role);
    }
    
    sql += ` ORDER BY u.id`;
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), parseInt(offset));
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: '获取用户列表失败' });
      }
      res.json({ success: true, data: rows });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 获取用户详情
router.get('/:id', (req, res) => {
  const sql = `
    SELECT u.id, u.username, u.email, u.phone, u.role, u.status, u.department_id, u.position_id,
           d.name as department_name, p.name as position_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE u.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取用户详情失败' });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: row });
  });
});

// 更新用户信息
router.put('/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { email, phone, department_id, position_id } = req.body;
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 权限检查：只能修改自己，或者管理员修改
    if (decoded.id !== parseInt(req.params.id) && decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: '没有权限' });
    }
    
    const sql = `
      UPDATE users 
      SET email = ?, phone = ?, department_id = ?, position_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(sql, [email, phone, department_id, position_id, req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: '更新用户信息失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      res.json({ success: true, message: '更新成功' });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 删除用户（管理员）
router.delete('/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以删除用户' });
    }
    
    // 不能删除自己
    if (decoded.id === parseInt(req.params.id)) {
      return res.status(400).json({ success: false, message: '不能删除自己' });
    }
    
    const sql = `UPDATE users SET status = 'deleted' WHERE id = ?`;
    
    db.run(sql, [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: '删除用户失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      res.json({ success: true, message: '删除成功' });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 修改用户角色（管理员）
router.put('/:id/role', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { role } = req.body;
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  if (!['admin', 'manager', 'employee'].includes(role)) {
    return res.status(400).json({ success: false, message: '无效的角色' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以修改角色' });
    }
    
    const sql = `UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.run(sql, [role, req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: '修改角色失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      res.json({ success: true, message: '修改成功' });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

module.exports = router;
