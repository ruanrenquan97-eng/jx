import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getUsers } from '../utils/api'

function Departments() {
  const [data, setData] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { loadData(); loadUsers() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getDepartments({})
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
      const res = await deleteDepartment(id)
      if (res.success) { message.success('删除成功'); loadData() }
    } catch (error) { message.error('删除失败') }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        const res = await updateDepartment(editingItem.id, values)
        if (res.success) { message.success('更新成功'); loadData() }
      } else {
        const res = await createDepartment(values)
        if (res.success) { message.success('创建成功'); loadData() }
      }
      setModalVisible(false)
    } catch (error) { message.error('操作失败') }
  }

  const columns = [
    { title: '部门名称', dataIndex: 'name', key: 'name' },
    { title: '负责人', dataIndex: 'manager_name', key: 'manager_name', render: v => v || '-' },
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
      <h2 className="page-title">部门管理</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>添加部门</Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={false} />

      <Modal title={editingItem ? '编辑部门' : '添加部门'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="部门名称" rules={[{ required: true }]}>
            <Input placeholder="例如：技术部" />
          </Form.Item>
          <Form.Item name="manager_id" label="负责人">
            <Select placeholder="选择负责人" allowClear>
              {users.map(u => <Select.Option key={u.id} value={u.id}>{u.username}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Departments
