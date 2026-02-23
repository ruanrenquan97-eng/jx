import axios from 'axios'

const API_BASE_URL = '/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(response => response.data, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
  return Promise.reject(error)
})

export const login = (username, password) => axiosInstance.post('/auth/login', { username, password })
export const register = (data) => axiosInstance.post('/auth/register', data)
export const getUserInfo = () => axiosInstance.get('/auth/me')
export const logout = () => localStorage.removeItem('token')

export const getDepartments = (params) => axiosInstance.get('/departments', { params })
export const createDepartment = (data) => axiosInstance.post('/departments', data)
export const updateDepartment = (id, data) => axiosInstance.put(`/departments/${id}`, data)
export const deleteDepartment = (id) => axiosInstance.delete(`/departments/${id}`)

export const getPositions = (params) => axiosInstance.get('/positions', { params })
export const createPosition = (data) => axiosInstance.post('/positions', data)
export const updatePosition = (id, data) => axiosInstance.put(`/positions/${id}`, data)
export const deletePosition = (id) => axiosInstance.delete(`/positions/${id}`)

export const getResponsibilities = (params) => axiosInstance.get('/responsibilities', { params })
export const createResponsibility = (data) => axiosInstance.post('/responsibilities', data)
export const updateResponsibility = (id, data) => axiosInstance.put(`/responsibilities/${id}`, data)
export const deleteResponsibility = (id) => axiosInstance.delete(`/responsibilities/${id}`)
export const getEmployeeResponsibilities = (userId) => axiosInstance.get(`/responsibilities/employee/${userId}`)

export const getQuestions = (params) => axiosInstance.get('/questions', { params })
export const createQuestion = (data) => axiosInstance.post('/questions', data)
export const updateQuestion = (id, data) => axiosInstance.put(`/questions/${id}`, data)
export const deleteQuestion = (id) => axiosInstance.delete(`/questions/${id}`)

export const getExams = (params) => axiosInstance.get('/exams', { params })
export const getAvailableExams = () => axiosInstance.get('/exams/available')
export const getExam = (id) => axiosInstance.get(`/exams/${id}`)
export const getExamQuestions = (id) => axiosInstance.get(`/exams/${id}/questions`)
export const submitExam = (id, answers) => axiosInstance.post(`/exams/${id}/submit`, { answers })
export const createExam = (data) => axiosInstance.post('/exams', data)
export const updateExam = (id, data) => axiosInstance.put(`/exams/${id}`, data)
export const deleteExam = (id) => axiosInstance.delete(`/exams/${id}`)

export const getExamRecords = (params) => axiosInstance.get('/exam-records', { params })
export const getMyExamStats = () => axiosInstance.get('/exam-records/stats/my')

export const getPerformanceList = (params) => axiosInstance.get('/performance', { params })
export const getMyPerformance = () => axiosInstance.get('/performance/my')
export const getPerformance = (id) => axiosInstance.get(`/performance/${id}`)
export const calculatePerformance = (userId, cycle) => axiosInstance.post('/performance/calculate', { user_id: userId, cycle })
export const updatePerformance = (id, data) => axiosInstance.put(`/performance/${id}`, data)

export const getUsers = (params) => axiosInstance.get('/users', { params })
export const updateUser = (id, data) => axiosInstance.put(`/users/${id}`, data)
export const deleteUser = (id) => axiosInstance.delete(`/users/${id}`)
export const updateUserRole = (id, role) => axiosInstance.put(`/users/${id}/role`, { role })

export const getFeishuConfig = () => axiosInstance.get('/feishu/config')
export const setFeishuConfig = (data) => axiosInstance.post('/feishu/config', data)
export const testFeishu = () => axiosInstance.post('/feishu/test')
export const getFeishuReports = (params) => axiosInstance.get('/feishu/reports', { params })
export const syncFeishuReports = (date) => axiosInstance.post('/feishu/sync', { date })

export default axiosInstance
