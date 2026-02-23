import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Tabs } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { login, register } from '../utils/api'

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const res = await login(values.username, values.password)
      if (res.success) {
        onLogin(res.data.user, res.data.token)
      }
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败')
    }
    setLoading(false)
  }

  const handleRegister = async (values) => {
    setLoading(true)
    try {
      const res = await register(values)
      if (res.success) {
        message.success('注册成功，请登录')
        setActiveTab('login')
      }
    } catch (error) {
      message.error(error.response?.data?.message || '注册失败')
    }
    setLoading(false)
  }

  const LoginForm = () => (
    <Form onFinish={handleLogin} layout="vertical">
      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} size="large" block>
          登录
        </Button>
      </Form.Item>
    </Form>
  )

  const RegisterForm = () => (
    <Form onFinish={handleRegister} layout="vertical">
      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
      </Form.Item>
      <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
        <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
      </Form.Item>
      <Form.Item name="phone">
        <Input prefix={<PhoneOutlined />} placeholder="手机号" size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} size="large" block>
          注册
        </Button>
      </Form.Item>
    </Form>
  )

  return (
    <div className="login-container">
      <Card className="login-box">
        <h1 className="login-title">绩效管理系统</h1>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane key="login" tab="登录">
            <LoginForm />
          </Tabs.TabPane>
          <Tabs.TabPane key="register" tab="注册">
            <RegisterForm />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default Login
