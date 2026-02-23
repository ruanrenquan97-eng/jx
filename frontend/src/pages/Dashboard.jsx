import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Progress, Spin } from 'antd'
import { TrophyOutlined, BookOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons'
import { getMyPerformance, getAvailableExams, getMyExamStats, getFeishuReports } from '../utils/api'

function Dashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [performance, setPerformance] = useState([])
  const [exams, setExams] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [perfRes, examRes, statsRes] = await Promise.all([
        getMyPerformance(),
        getAvailableExams(),
        getMyExamStats()
      ])
      if (perfRes.success) setPerformance(perfRes.data)
      if (examRes.success) setExams(examRes.data)
      if (statsRes.success) setStats(statsRes.data)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const columns = [
    { title: '考核周期', dataIndex: 'cycle', key: 'cycle' },
    { title: '考试分数', dataIndex: 'exam_score', key: 'exam_score', render: v => v?.toFixed(1) || '-' },
    { title: 'KPI分数', dataIndex: 'kpi_score', key: 'kpi_score', render: v => v?.toFixed(1) || '-' },
    { title: '日报合规', dataIndex: 'daily_log_score', key: 'daily_log_score', render: v => v ? <Progress percent={v.toFixed(0)} size="small" /> : '-' },
    { title: '最终得分', dataIndex: 'final_score', key: 'final_score', render: v => v?.toFixed(1) || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => s === 'draft' ? '草稿' : '已完成' },
  ]

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />

  return (
    <div>
      <h2 className="page-title">工作台</h2>
      
      <Row gutter={16} className="dashboard-grid">
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="本月绩效得分" value={performance[0]?.final_score?.toFixed(1) || '-'} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="完成考试数" value={stats.completedExams || 0} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="平均考试分" value={stats.averageScore || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="待参加考试" value={exams.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="近期绩效记录" style={{ marginBottom: 16 }}>
            <Table dataSource={performance.slice(0, 5)} columns={columns} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="待参加考试">
            {exams.length === 0 ? <p style={{ color: '#999' }}>暂无待参加考试</p> : (
              <Table dataSource={exams} rowKey="id" pagination={false} size="small"
                columns={[{ title: '考试名称', dataIndex: 'title' }, { title: '截止时间', dataIndex: 'end_time' }]} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
