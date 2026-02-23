import React, { useState, useEffect } from 'react'
import { Card, Button, Radio, message, Spin, Result } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { getExamQuestions, submitExam } from '../utils/api'

function ExamDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    loadExam()
  }, [id])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && exam && !submitted) {
      handleSubmit()
    }
  }, [timeLeft, exam, submitted])

  const loadExam = async () => {
    try {
      const res = await getExamQuestions(id)
      if (res.success) {
        setExam(res.data.exam)
        setQuestions(res.data.questions)
        setTimeLeft(res.data.duration * 60)
      }
    } catch (error) {
      message.error(error.response?.data?.message || '加载考试失败')
    }
    setLoading(false)
  }

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await submitExam(id, answers)
      if (res.success) {
        setSubmitted(true)
        setResult(res.data)
        message.success('提交成功')
      }
    } catch (error) {
      message.error('提交失败')
    }
    setSubmitting(false)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />

  if (submitted && result) {
    return (
      <div className="exam-container">
        <Card>
          <Result
            status="success"
            title="考试完成"
            subTitle={`得分：${result.score}分 / ${result.totalCount}题对了${result.correctCount}题`}
            extra={[
              <Button type="primary" key="back" onClick={() => navigate('/exams')}>返回考试列表</Button>,
            ]}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="exam-container">
      <div className="exam-header">
        <div>
          <h2>{exam?.title}</h2>
          <p style={{ color: '#999' }}>{exam?.description}</p>
        </div>
        <div className="exam-timer">
          剩余时间：{formatTime(timeLeft)}
        </div>
      </div>

      {questions.map((q, index) => (
        <Card key={q.id} className="question-card" style={{ marginBottom: 16 }}>
          <div className="question-number">第 {index + 1} 题 ({q.type === 'single' ? '单选' : q.type === 'multiple' ? '多选' : '判断'})</div>
          <div className="question-content">{q.content}</div>
          <Radio.Group onChange={e => handleAnswer(q.id, [e.target.value])} value={answers[q.id]?.[0]}>
            {q.options.map((opt, i) => (
              <Radio key={i} value={opt} style={{ display: 'block', marginBottom: 8 }}>{opt}</Radio>
            ))}
          </Radio.Group>
        </Card>
      ))}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button type="primary" size="large" loading={submitting} onClick={handleSubmit}>
          提交试卷
        </Button>
      </div>
    </div>
  )
}

export default ExamDetail
