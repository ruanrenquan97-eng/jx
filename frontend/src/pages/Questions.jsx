import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../utils/api'

function Questions({ user }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getQuestions({})
      if (res.success) setData(res.data)
    } catch (error) { message.error('加载失败') }
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue({ ...record, options: record.options || [] })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await deleteQuestion(id)
      if (res.success) { message.success('删除成功'); loadData() }
    } catch (error) { message.error('删除失败') }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        const res = await updateQuestion(editingItem.id, values)
        if (res.success) { message.success('更新成功'); loadData() }
      } else {
        const res = await createQuestion(values)
        if (res.success) { message.success('创建成功'); loadData() }
      }
      setModalVisible(false)
    } catch (error) { message.error('操作失败') }
  }

  const columns = [
    { title: '题型', dataIndex: 'type', key: 'type', width: 80, render: t => <Tag>{t === 'single' ? '单选' : t === 'multiple' ? '多选' : '判断'}</Tag> },
    { title: '题目内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '分类', dataIndex: 'category', key: 'category', width: 80 },
    { title: '难度', dataIndex: 'difficulty', key: 'difficulty', width: 80, render: d => <Tag color={d === 'easy' ? 'green' : d === 'hard' ? 'red' : 'orange'}>{d}</Tag> },
    { title: '操作', key: 'action', width: 120, render: (_, record) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ]

  return (
    <div>
      <h2 className="page-title">题库管理</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>添加题目</Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title={editingItem ? '编辑题目' : '添加题目'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="题型" rules={[{ required: true }]}>
            <Select placeholder="选择题型">
              <Select.Option value="single">单选题</Select.Option>
              <Select.Option value="multiple">多选题</Select.Option>
              <Select.Option value="judge">判断题</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="题目内容" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="输入题目内容" />
          </Form.Item>
          <Form.Item name="options" label="选项" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="JSON格式：['选项1', '选项2', '选项3']" />
          </Form.Item>
          <Form.Item name="correct_answer" label="正确答案" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="JSON格式：['正确答案']" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类">
              <Select.Option value="前端">前端</Select.Option>
              <Select.Option value="后端">后端</Select.Option>
              <Select.Option value="通用">通用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="difficulty" label="难度">
            <Select placeholder="选择难度">
              <Select.Option value="easy">简单</Select.Option>
              <Select.Option value="medium">中等</Select.Option>
              <Select.Option value="hard">困难</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Questions
