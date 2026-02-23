# 绩效管理系统部署指南

## 线上部署（推荐使用）

### 方案1：使用 Vercel + Railway（免费）

#### 1. 部署后端到 Railway
1. 访问 https://railway.app 注册账号
2. 创建新项目，选择 "Deploy from GitHub"
3. 连接您的 GitHub 仓库
4. Railway 会自动部署 Node.js 后端

#### 2. 部署前端到 Vercel
1. 访问 https://vercel.com 注册账号
2. 导入 GitHub 仓库
3. Vercel 会自动识别为 React + Vite 项目
4. 在环境变量中添加： `VITE_API_URL=您的Railway后端地址`

### 方案2：使用 Render（免费）

1. 访问 https://render.com 注册账号
2. 创建 Web Service，选择 GitHub 仓库
3. 构建命令：`npm install`
4. 启动命令：`node server.js`

### 方案3：使用自己的服务器

```bash
# 安装 Node.js 和 npm
# 上传 server 文件夹到服务器
cd server
npm install
npm install -g pm2
pm2 start server.js --name performance-system

# 配置 Nginx 反向代理
```

## 本地运行

```bash
# 启动后端
cd server
npm install
node server.js

# 启动前端（新终端）
cd frontend
npm install
npm run dev
```

## 功能说明

1. **岗位职责管理**：管理员可以添加/编辑/删除每个岗位的职责和KPI
2. **在线考试**：每月进行在线考试，系统自动评分
3. **飞书集成**：配置飞书App后，可自动同步每日日报
4. **绩效计算**：根据考试分、KPI分、日报合规率自动计算绩效

## 默认账号
- 用户名：admin
- 密码：admin123
