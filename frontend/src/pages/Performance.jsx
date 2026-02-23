import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, Progress, Tag } from 'antd'
import { CalculatorOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPerformanceList, calculatePerformance, updatePerformance, getUsers, getPositions } from '../utils/api'

const { RangePicker } = DatePicker

function Performance({ user }) {
  const [data, setData] = useState([])
  const [users, setUsers] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { loadData(); loadUsers(); loadPositions() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getPerformanceList({})
      if (res.success) setData(res.data)
    } catch (error) { message.error('加载失败') }
    setLoading(false)
  }

  const loadUsers = async () => {
    try {
      const res = await getUsers({})
      if (res.success) setUsers(res.data)
    } catch (error) { console.error(error) }
  }

  const loadPositions = async () => {
    try {
      const res = await getPositions({})
      if (res.success) setPositions(res.data)
    } catch (error) { console.error(error) }
  }

  const handleCalculate = async () => {
    try {
      const values = await form.validateFields()
      const res = await calculatePerformance(values.user_id, values.cycle)
      if (res.success) {
        message.success('计算成功')
        loadData()
      }
    } catch (error) { message.error('计算失败') }
  }

  const handleReview = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const res = await updatePerformance(editingItem.id, values)
      if (res.success) { message.success('更新成功'); loadData() }
      setModalVisible(false)
    } catch (error) { message.error('操作失败') }
  }

  const columns = [
    { title: '员工', dataIndex: 'username', key: 'username', width: 100 },
    { title: '部门', dataIndex: 'department_name', key: 'department_name', width: 100 },
    { title: '岗位', dataIndex: 'position_name', key: 'position_name', width: 120 },
    { title: '考核周期', dataIndex: 'cycle', key: 'cycle', width: 100 },
    { title: '考试分', dataIndex: 'exam_score', key: 'exam_score', width: 80, render: v => v?.toFixed(1) || '-' },
    { title: 'KPI分', dataIndex: 'kpi_score', key: 'kpi_score', width: 80, render: v => <Progress percent={v || 0} size="small" /> },
    { title: '日报分', dataIndex: 'daily_log_score', key: 'daily_log_score', width: 80, render: v => <Progress percent={v || 0} size="small" /> },
    { title: '最终得分', dataIndex: 'final_score', key: 'final_score', width: 100, render: v => <Tag color={v >= 90 ? 'green' : v >= 60 ? 'orange' : 'red'}>{v?.toFixed(1) || '-'}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: s => <Tag>{s === 'draft' ? '草稿' : '已完成'}</Tag> },
    { title: '操作', key: 'action', width: 100, render: (_, record) => (
      <Button type="link" size="small" onClick={() => handleReview(record)}>审核</Button>
    )},
  ]

  return (
    <div>
      <h2 className="page-title">绩效管理</h2>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={form}>
          <Form.Item name="user_id" label="员工" rules={[{ required: true }]}>
            <Select placeholder="选择员工" style={{ width: 150 }}>
              {users.map(u => <Select.Option key={u.id} value={u.id}>{u.username}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="cycle" label="考核周期" rules={[{ required: true }]}>
            <Select placeholder="选择月份" style={{ width: 150 }}>
              {Array.from({ length: 12 }, (_, i) => {
                const date = dayjs().subtract(i, 'month')
                return <Select.Option key={date.format('YYYY-MM')} value={date.format('YYYY-MM')}>{date.format('YYYY年MM月')}</Select.Option>
              })}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<CalculatorOutlined />} onClick={handleCalculate}>计算绩效</Button>
          </Form.Item>
        </Form>
      </Card>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="审核绩效" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="manager_comment" label="评语">
            <Input.TextArea rows={3} placeholder="输入评语" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Performance
