import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Layout, Menu, Dropdown, Avatar, Space, message } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BookOutlined,
  BarChartOutlined,
  BellOutlined
} from '@ant-design/icons'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Responsibilities from './pages/Responsibilities'
import Exams from './pages/Exams'
import ExamDetail from './pages/ExamDetail'
import Questions from './pages/Questions'
import Performance from './pages/Performance'
import Users from './pages/Users'
import Departments from './pages/Departments'
import Positions from './pages/Positions'
import FeishuReports from './pages/FeishuReports'
import { getUserInfo, logout } from './utils/api'

const { Header, Sider, Content } = Layout

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const userInfo = await getUserInfo()
        setUser(userInfo.data)
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    setUser(userData)
    message.success('登录成功')
    navigate('/')
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    message.success('已退出登录')
    navigate('/login')
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/responsibilities', icon: <FileTextOutlined />, label: '岗位职责' },
    { key: '/exams', icon: <BookOutlined />, label: '在线考试' },
    { key: '/performance', icon: <BarChartOutlined />, label: '绩效管理' },
    { key: '/feishu', icon: <FileTextOutlined />, label: '飞书日报' },
  ]

  if (user.role === 'admin' || user.role === 'manager') {
    menuItems.push(
      { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
      { key: '/departments', icon: <TeamOutlined />, label: '部门管理' },
      { key: '/positions', icon: <TeamOutlined />, label: '岗位管理' },
      { key: '/questions', icon: <BookOutlined />, label: '题库管理' },
    )
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout()
    }
  }

  return (
    <Layout className="app-layout" style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light" style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <div className="logo">绩效管理系统</div>
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['/']}
          style={{ borderRight: 0 }}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="layout-header">
          <div></div>
          <Dropdown 
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }} 
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <span>{user.username}</span>
              <span style={{ color: '#999', fontSize: '12px' }}>
                {user.role === 'admin' ? '管理员' : user.role === 'manager' ? '经理' : '员工'}
              </span>
            </Space>
          </Dropdown>
        </Header>
        <Content className="layout-content">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/responsibilities" element={<Responsibilities user={user} />} />
            <Route path="/exams" element={<Exams user={user} />} />
            <Route path="/exams/:id" element={<ExamDetail user={user} />} />
            <Route path="/performance" element={<Performance user={user} />} />
            <Route path="/feishu" element={<FeishuReports user={user} />} />
            <Route path="/users" element={<Users user={user} />} />
            <Route path="/departments" element={<Departments user={user} />} />
            <Route path="/positions" element={<Positions user={user} />} />
            <Route path="/questions" element={<Questions user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
