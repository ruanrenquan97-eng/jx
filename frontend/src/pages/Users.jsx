import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'
import { getUsers, updateUser, deleteUser, updateUserRole, getDepartments, getPositions } from '../utils/api'

function Users({ user }) {
  const [data, setData] = useState([])
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { loadData(); loadDepartments(); loadPositions() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getUsers({})
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

  const loadPositions = async () => {
    try {
      const res = await getPositions({})
      if (res.success) setPositions(res.data)
    } catch (error) { console.error(error) }
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await deleteUser(id)
      if (res.success) { message.success('删除成功'); loadData() }
    } catch (error) { message.error('删除失败') }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const res = await updateUser(editingItem.id, values)
      if (res.success) { message.success('更新成功'); loadData() }
      setModalVisible(false)
    } catch (error) { message.error('操作失败') }
  }

  const handleRoleChange = async (id, role) => {
    try {
      const res = await updateUserRole(id, role)
      if (res.success) { message.success('角色更新成功'); loadData() }
    } catch (error) { message.error('更新失败') }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '部门', dataIndex: 'department_name', key: 'department_name' },
    { title: '岗位', dataIndex: 'position_name', key: 'position_name' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (r, record) => (
      <Select value={r} size="small" style={{ width: 80 }} onChange={val => handleRoleChange(record.id, val)} disabled={user.role !== 'admin'}>
        <Select.Option value="admin">管理员</Select.Option>
        <Select.Option value="manager">经理</Select.Option>
        <Select.Option value="employee">员工</Select.Option>
      </Select>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'active' ? 'green' : 'red'}>{s}</Tag> },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        {user.role === 'admin' && record.id !== user.id && (
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <h2 className="page-title">用户管理</h2>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="编辑用户" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="department_id" label="部门">
            <Select placeholder="选择部门" allowClear>
              {departments.map(d => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="position_id" label="岗位">
            <Select placeholder="选择岗位" allowClear>
              {positions.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
