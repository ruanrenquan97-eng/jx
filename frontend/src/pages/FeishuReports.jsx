import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, DatePicker, message, Space, Tag, Tabs } from 'antd'
import { SyncOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getFeishuConfig, setFeishuConfig, testFeishu, getFeishuReports, syncFeishuReports, getUsers } from '../utils/api'

const { RangePicker } = DatePicker

function FeishuReports({ user }) {
  const [config, setConfig] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [configModalVisible, setConfigModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => { loadConfig(); loadReports() }, [])

  const loadConfig = async () => {
    try {
      const res = await getFeishuConfig()
      if (res.success && res.data) {
        setConfig(res.data)
      }
    } catch (error) { console.error(error) }
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await getFeishuReports({})
      if (res.success) setReports(res.data)
    } catch (error) { message.error('加载失败') }
    setLoading(false)
  }

  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields()
      const res = await setFeishuConfig(values)
      if (res.success) {
        message.success('配置保存成功')
        setConfigModalVisible(false)
        loadConfig()
      }
    } catch (error) { message.error('保存失败') }
  }

  const handleTest = async () => {
    try {
      const res = await testFeishu()
      if (res.success) message.success('连接成功')
    } catch (error) { message.error('连接失败') }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncFeishuReports()
      if (res.success) {
        message.success('同步完成')
        loadReports()
      }
    } catch (error) { message.error('同步失败') }
    setSyncing(false)
  }

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 100 },
    { title: '日期', dataIndex: 'report_date', key: 'report_date', width: 120 },
    { title: '提交时间', dataIndex: 'submit_time', key: 'submit_time', width: 180 },
    { title: '日报内容', dataIndex: 'content', key: 'content', ellipsis: true, render: v => v || '-' },
    { title: '同步时间', dataIndex: 'synced_at', key: 'synced_at', width: 180 },
  ]

  const isAdmin = user.role === 'admin'

  return (
    <div>
      <h2 className="page-title">飞书日报</h2>
      
      <Card style={{ marginBottom: 16 }}>
        <Space>
          {isAdmin && (
            <>
              <Button icon={<SettingOutlined />} onClick={() => { form.setFieldsValue(config); setConfigModalVisible(true) }}>飞书配置</Button>
              <Button icon={<SyncOutlined />} onClick={handleSync} loading={syncing}>同步日报</Button>
            </>
          )}
          <Button icon={<ReloadOutlined />} onClick={loadReports}>刷新</Button>
        </Space>
        <div style={{ marginTop: 16, color: '#999' }}>
          状态: {config?.status === 'active' ? <Tag color="green">已连接</Tag> : <Tag color="default">未配置</Tag>}
        </div>
      </Card>

      <Table dataSource={reports} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="飞书配置" open={configModalVisible} onOk={handleSaveConfig} onCancel={() => setConfigModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="app_id" label="App ID" rules={[{ required: true }]}>
            <Input placeholder="飞书应用 App ID" />
          </Form.Item>
          <Form.Item name="app_secret" label="App Secret" rules={[{ required: true }]}>
            <Input.Password placeholder="飞书应用 App Secret" />
          </Form.Item>
          <Button onClick={handleTest}>测试连接</Button>
        </Form>
      </Modal>
    </div>
  )
}

export default FeishuReports
