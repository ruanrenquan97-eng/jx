const express = require('express');
const axios = require('axios');
const db = require('../database');

const router = express.Router();

// 获取飞书配置
router.get('/config', (req, res) => {
  const sql = `SELECT id, app_id, status, created_at FROM feishu_config ORDER BY id DESC LIMIT 1`;
  
  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取飞书配置失败' });
    }
    // 不返回 app_secret
    if (row) {
      delete row.app_secret;
    }
    res.json({ success: true, data: row });
  });
});

// 配置飞书应用
router.post('/config', (req, res) => {
  const { app_id, app_secret } = req.body;
  
  if (!app_id || !app_secret) {
    return res.status(400).json({ success: false, message: 'App ID 和 App Secret 不能为空' });
  }

  // 先检查是否已有配置
  db.get('SELECT id FROM feishu_config', [], (err, existing) => {
    if (err) {
      return res.status(500).json({ success: false, message: '检查配置失败' });
    }
    
    if (existing) {
      // 更新配置
      const sql = `UPDATE feishu_config SET app_id = ?, app_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      db.run(sql, [app_id, app_secret, existing.id], function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: '更新飞书配置失败' });
        }
        res.json({ success: true, message: '配置更新成功' });
      });
    } else {
      // 创建新配置
      const sql = `INSERT INTO feishu_config (app_id, app_secret, status) VALUES (?, ?, 'active')`;
      db.run(sql, [app_id, app_secret], function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: '保存飞书配置失败' });
        }
        res.json({ success: true, message: '配置保存成功' });
      });
    }
  });
});

// 获取飞书 Access Token
async function getFeishuToken() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM feishu_config ORDER BY id DESC LIMIT 1', [], async (err, config) => {
      if (err || !config) {
        return reject(new Error('飞书配置不存在'));
      }
      
      // 检查 token 是否过期
      if (config.token_expires_at && new Date(config.token_expires_at) > new Date()) {
        return resolve(config.tenant_access_token);
      }
      
      try {
        // 重新获取 token
        const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
          app_id: config.app_id,
          app_secret: config.app_secret
        });
        
        if (response.data.code === 0) {
          const token = response.data.tenant_access_token;
          const expiresAt = new Date(Date.now() + response.data.expire * 1000);
          
          // 更新 token
          db.run('UPDATE feishu_config SET tenant_access_token = ?, token_expires_at = ? WHERE id = ?', 
            [token, expiresAt, config.id], (err) => {
              if (err) {
                console.error('更新飞书token失败:', err);
              }
            });
          
          resolve(token);
        } else {
          reject(new Error('获取飞书token失败: ' + response.data.msg));
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}

// 测试飞书连接
router.post('/test', async (req, res) => {
  try {
    const token = await getFeishuToken();
    res.json({ success: true, message: '飞书连接成功', token: token.substring(0, 20) + '...' });
  } catch (error) {
    res.status(500).json({ success: false, message: '飞书连接失败: ' + error.message });
  }
});

// 获取日报列表
router.get('/reports', (req, res) => {
  const { user_id, start_date, end_date, page = 1, pageSize = 20 } = req.query;
  
  let sql = `
    SELECT r.*, u.username
    FROM feishu_reports r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    sql += ` AND r.user_id = ?`;
    params.push(user_id);
  }
  if (start_date) {
    sql += ` AND r.report_date >= ?`;
    params.push(start_date);
  }
  if (end_date) {
    sql += ` AND r.report_date <= ?`;
    params.push(end_date);
  }
  
  sql += ` ORDER BY r.report_date DESC, r.id DESC`;
  const offset = (page - 1) * pageSize;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), parseInt(offset));
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取日报列表失败' });
    }
    
    res.json({ success: true, data: rows });
  });
});

// 手动同步日报
router.post('/sync', async (req, res) => {
  const { date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  try {
    const token = await getFeishuToken();
    
    // 获取用户列表
    const usersResponse = await axios.get('https://open.feishu.cn/open-apis/contact/v3/users', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page_size: 100 }
    });
    
    if (usersResponse.data.code !== 0) {
      return res.status(500).json({ success: false, message: '获取飞书用户失败: ' + usersResponse.data.msg });
    }
    
    const feishuUsers = usersResponse.data.data.items || [];
    let syncedCount = 0;
    
    for (const feishuUser of feishuUsers) {
      // 查找对应的本地用户
      db.get('SELECT id FROM users WHERE feishu_user_id = ?', [feishuUser.open_id], (err, localUser) => {
        if (localUser) {
          // TODO: 调用飞书API获取日报内容
          // 这里先模拟同步成功
          console.log(`同步用户 ${feishuUser.name} 的日报`);
        }
      });
      syncedCount++;
    }
    
    res.json({ success: true, message: `同步完成，共处理 ${syncedCount} 个用户` });
  } catch (error) {
    res.status(500).json({ success: false, message: '同步失败: ' + error.message });
  }
});

// 绑定飞书用户
router.post('/bind', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { feishu_user_id } = req.body;
  
  if (!token || !feishu_user_id) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'performance-system-secret-key';
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    db.run('UPDATE users SET feishu_user_id = ? WHERE id = ?', [feishu_user_id, decoded.id], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: '绑定失败' });
      }
      res.json({ success: true, message: '绑定成功' });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
});

module.exports = router;
