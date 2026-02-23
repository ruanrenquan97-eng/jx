import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getResponsibilities, createResponsibility, updateResponsibility, deleteResponsibility, getPositions, getEmployeeResponsibilities } from '../utils/api'

function Responsibilities({ user }) {
  const [data, setData] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadPositions()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getResponsibilities({})
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
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await deleteResponsibility(id)
      if (res.success) { message.success('删除成功'); loadData() }
    } catch (error) { message.error('删除失败') }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        const res = await updateResponsibility(editingItem.id, values)
        if (res.success) { message.success('更新成功'); loadData() }
      } else {
        const res = await createResponsibility(values)
        if (res.success) { message.success('创建成功'); loadData() }
      }
      setModalVisible(false)
    } catch (error) { message.error('操作失败') }
  }

  const columns = [
    { title: '岗位', dataIndex: 'position_name', key: 'position_name', width: 150 },
    { title: '职责内容', dataIndex: 'content', key: 'content' },
    { title: '权重', dataIndex: 'weight', key: 'weight', width: 80, render: v => `${v}%` },
    { title: 'KPI标准', dataIndex: 'kpi_criteria', key: 'kpi_criteria' },
    { title: '操作', key: 'action', width: 120, render: (_, record) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ]

  const isAdmin = user.role === 'admin' || user.role === 'manager'

  return (
    <div>
      <h2 className="page-title">岗位职责管理</h2>
      {isAdmin && (
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>添加职责</Button>
      )}
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title={editingItem ? '编辑职责' : '添加职责'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="position_id" label="岗位" rules={[{ required: true }]}>
            <Select placeholder="选择岗位">
              {positions.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="content" label="职责内容" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="描述岗位职责" />
          </Form.Item>
          <Form.Item name="weight" label="权重(%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="kpi_criteria" label="KPI考核标准">
            <Input.TextArea rows={2} placeholder="例如：完成率 >= 90%" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Responsibilities
