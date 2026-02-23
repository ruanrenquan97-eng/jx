import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getPositions, createPosition, updatePosition, deletePosition, getDepartments } from '../utils/api'

function Positions() {
  const [data, setData] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { loadData(); loadDepartments() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getPositions({})
      if (res.success) setData(res.data)
    } catch (error) { message.error('加载失败') }
    setLoading(false)
  }

  const loadDepartments = async () => {
    try {
      const res = await getDepartments({})
      if (res.success) setDepartments(res.data)
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
      const res = await deletePosition(id)
      if (res.success) { message.success('删除成功'); loadData() }
    } catch (error) { message.error('删除失败') }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        const res = await updatePosition(editingItem.id, values)
        if (res.success) { message.success('更新成功'); loadData() }
      } else {
        const res = await createPosition(values)
        if (res.success) { message.success('创建成功'); loadData() }
      }
      setModalVisible(false)
    } catch (error) { message.error('操作失败') }
  }

  const columns = [
    { title: '岗位名称', dataIndex: 'name', key: 'name' },
    { title: '部门', dataIndex: 'department_name', key: 'department_name', render: v => v || '-' },
    { title: '级别', dataIndex: 'level', key: 'level' },
    { title: '操作', key: 'action', render: (_, record) => (
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
      <h2 className="page-title">岗位管理</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>添加岗位</Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={false} />

      <Modal title={editingItem ? '编辑岗位' : '添加岗位'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="岗位名称" rules={[{ required: true }]}>
            <Input placeholder="例如：前端开发工程师" />
          </Form.Item>
          <Form.Item name="department_id" label="所属部门">
            <Select placeholder="选择部门" allowClear>
              {departments.map(d => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="level" label="级别">
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Positions
