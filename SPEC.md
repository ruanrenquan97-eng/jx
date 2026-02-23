# 绩效管理系统 - 技术规范文档

## 1. 项目概述

**项目名称**：企业智能绩效管理系统 (EIPMS)

**项目类型**：B/S Web应用 - 企业内部管理系统

**核心功能**：
- 基于岗位职责的绩效考核
- 每月在线考试系统
- 飞书日报自动同步
- 多角色权限管理

**目标用户**：
- 普通员工：查看职责、参与考试、查看绩效
- 部门经理：管理下属职责、审批考核
- 管理员：系统配置、题库管理、全局分析

---

## 2. 技术架构

### 2.1 技术栈

**前端**：
- React 18 + TypeScript
- Ant Design 5.0 组件库
- React Router 6 路由
- Axios 请求库
- ECharts 可视化

**后端**：
- Node.js + Express
- JWT 认证
- SQLite 本地数据库（演示）
- 飞书 OpenAPI 集成

**数据库表结构**：
- users - 用户表
- departments - 部门表
- positions - 岗位表
- job_responsibilities - 岗位职责表
- question_bank - 题库表
- exams - 考试场次表
- exam_records - 考试记录表
- feishu_reports - 飞书日报表
- performance_reviews - 绩效考核表

---

## 3. 功能模块

### 3.1 认证模块
- 用户注册（手机号/邮箱/用户名）
- 用户登录（账号密码）
- JWT Token 认证
- 角色权限：admin, manager, employee

### 3.2 岗位职责管理
- 岗位 CRUD 操作
- 岗位职责配置（内容、权重、KPI标准）
- 员工岗位分配

### 3.3 考试系统
- 题库管理（单选/多选/判断）
- 考试场次创建
- 在线答题
- 自动评分
- 成绩查询

### 3.4 飞书集成
- 飞书应用配置
- 每日日报自动同步
- 日报数据存储和展示

### 3.5 绩效管理
- 月度绩效自动计算
- 多维度考核（职责分+考试分+日报合规率）
- 绩效报表和可视化

---

## 4. UI/UX 设计规范

### 4.1 布局结构
- 左侧固定导航栏（240px）
- 顶部 Header（64px）
- 内容区域自适应

### 4.2 色彩规范
- 主色：#1890FF（科技蓝）
- 成功色：#52C41A
- 警告色：#FAAD14
- 错误色：#FF4D4F
- 背景色：#F0F2F5
- 文字色：#333333

### 4.3 字体规范
- 主字体：-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- 标题：24px / 20px / 16px
- 正文：14px
- 小字：12px

### 4.4 组件规范
- 按钮：主要按钮蓝色，次要按钮灰色
- 卡片：白色背景，圆角8px，阴影
- 表格：斑马纹，分页
- 表单：标签上置，验证提示

---

## 5. API 接口设计

### 认证接口
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- GET /api/auth/me - 获取当前用户

### 部门岗位接口
- GET /api/departments - 获取部门列表
- POST /api/departments - 创建部门
- GET /api/positions - 获取岗位列表
- POST /api/positions - 创建岗位
- GET /api/responsibilities - 获取岗位职责
- POST /api/responsibilities - 创建岗位职责
- PUT /api/responsibilities/:id - 更新岗位职责

### 考试接口
- GET /api/questions - 获取题库
- POST /api/questions - 添加题目
- GET /api/exams - 获取考试列表
- POST /api/exams - 创建考试
- GET /api/exams/:id - 获取考试详情
- POST /api/exams/:id/submit - 提交试卷
- GET /api/exam-records - 获取考试记录

### 飞书接口
- POST /api/feishu/config - 配置飞书应用
- GET /api/feishu/reports - 获取日报列表
- POST /api/feishu/sync - 手动同步日报

### 绩效接口
- GET /api/performance - 获取绩效列表
- POST /api/performance/calculate - 计算绩效

---

## 6. 验收标准

### 功能验收
- [ ] 用户可以注册和登录
- [ ] 管理员可以管理岗位职责
- [ ] 员工可以参加月度考试
- [ ] 系统可以同步飞书日报
- [ ] 绩效数据正确计算和展示

### 界面验收
- [ ] 响应式布局
- [ ] 统一的视觉风格
- [ ] 流畅的交互体验
- [ ] 清晰的数据展示

### 性能验收
- [ ] 页面加载时间 < 3秒
- [ ] API响应时间 < 1秒
- [ ] 支持多用户并发访问
