const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'performance-system-secret-key';

// 用户注册
router.post('/register', (req, res) => {
  const { username, password, email, phone, department_id, position_id } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const sql = `
    INSERT INTO users (username, password, email, phone, department_id, position_id, role)
    VALUES (?, ?, ?, ?, ?, ?, 'employee')
  `;
  
  db.run(sql, [username, hashedPassword, email, phone, department_id, position_id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ success: false, message: '用户名已存在' });
      }
      return res.status(500).json({ success: false, message: '注册失败', error: err.message });
    }
    
    res.json({ 
      success: true, 
      message: '注册成功',
      data: { id: this.lastID, username }
    });
  });
});

// 用户登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  const sql = `SELECT * FROM users WHERE username = ? AND status = 'active'`;
  
  db.get(sql, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: '登录失败', error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          department_id: user.department_id,
          position_id: user.position_id
        }
      }
    });
  });
});

// 获取当前用户信息
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const sql = `
      SELECT u.id, u.username, u.email, u.phone, u.role, u.department_id, u.position_id,
             d.name as department_name, p.name as position_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN positions p ON u.position_id = p.id
      WHERE u.id = ?
    `;
    
    db.get(sql, [decoded.id], (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, message: '获取用户信息失败' });
      }
      
      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      res.json({ success: true, data: user });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 修改密码
router.put('/password', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { oldPassword, newPassword } = req.body;
  
  if (!token || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    db.get('SELECT password FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) {
        return res.status(500).json({ success: false, message: '用户不存在' });
      }

      const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: '原密码错误' });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [hashedPassword, decoded.id], (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: '修改密码失败' });
          }
          res.json({ success: true, message: '密码修改成功' });
        });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

module.exports = router;
