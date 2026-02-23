import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, DatePicker, InputNumber, Select, message, Space, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getExams, createExam, updateExam, deleteExam, getPositions } from '../utils/api'

const { RangePicker } = DatePicker

function Exams({ user }) {
  const [data, setData] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
    loadPositions()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getExams({})
      if (res.success) setData(res.data)
    } catch (error) { message.error('加载失败') }
    setLoading(false)
  }

  const loadPositions = async () => {
    try {
      const res = await getPositions({})
      if (res.success) setPositions(res.data)
    } catch (error) { console.error(error) }
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ question_count: 10, total_score: 100, duration_minutes: 60 })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      start_time: dayjs(record.start_time),
      end_time: dayjs(record.end_time)
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await deleteExam(id)
      if (res.success) { message.success('删除成功'); loadData() }
    } catch (error) { message.error('删除失败') }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        start_time: values.time[0].toISOString(),
        end_time: values.time[1].toISOString()
      }
      delete submitData.time
      
      if (editingItem) {
        const res = await updateExam(editingItem.id, submitData)
        if (res.success) { message.success('更新成功'); loadData() }
      } else {
        const res = await createExam(submitData)
        if (res.success) { message.success('创建成功'); loadData() }
      }
      setModalVisible(false)
    } catch (error) { message.error('操作失败') }
  }

  const columns = [
    { title: '考试名称', dataIndex: 'title', key: 'title' },
    { title: '岗位', dataIndex: 'position_name', key: 'position_name', render: v => v || '全部' },
    { title: '时间', dataIndex: 'start_time', key: 'time', render: (_, r) => `${dayjs(r.start_time).format('MM-DD HH:mm')} - ${dayjs(r.end_time).format('MM-DD HH:mm')}` },
    { title: '时长(分)', dataIndex: 'duration_minutes', key: 'duration_minutes', width: 80 },
    { title: '题数', dataIndex: 'question_count', key: 'question_count', width: 60 },
    { title: '总分', dataIndex: 'total_score', key: 'total_score', width: 60 },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => (
      <Tag color={s === 'active' ? 'green' : s === 'completed' ? 'blue' : 'default'}>
        {s === 'active' ? '进行中' : s === 'completed' ? '已结束' : '待开始'}
      </Tag>
    )},
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => navigate(`/exams/${record.id}`)}>参加</Button>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ]

  const isAdmin = user.role === 'admin'

  return (
    <div>
      <h2 className="page-title">在线考试</h2>
      {isAdmin && (
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>创建考试</Button>
      )}
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title={editingItem ? '编辑考试' : '创建考试'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="考试名称" rules={[{ required: true }]}>
            <Input placeholder="例如：2024年1月月度考核" />
          </Form.Item>
          <Form.Item name="description" label="考试说明">
            <Input.TextArea rows={2} placeholder="考试说明" />
          </Form.Item>
          <Form.Item name="time" label="考试时间" rules={[{ required: true }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="target_position_id" label="针对岗位">
            <Select placeholder="不选择则全员可参加" allowClear>
              {positions.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="duration_minutes" label="时长(分钟)">
            <InputNumber min={10} max={180} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="question_count" label="题目数量">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="total_score" label="总分">
            <InputNumber min={10} max={200} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Exams
