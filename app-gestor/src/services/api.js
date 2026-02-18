import axios from 'axios';

// Definição da URL base do seu servidor
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const employeeProvider = {
  // Listar todos os empregados para o Dashboard
  getAll: () => api.get('/employees'),
  
  // Obter detalhes de um empregado específico
  getById: (id) => api.get(`/employees/${id}`),
  
  // Criar novo colaborador (com nome, dias totais e cor)
  create: (data) => api.post('/employees', data),
  
  // Atualizar dados ou cor
  update: (id, data) => api.put(`/employees/${id}`, data),
  
  // Remover colaborador
  delete: (id) => api.delete(`/employees/${id}`),
};

export const vacationProvider = {
  // Listar todas as férias para o Calendário Global
  getAll: () => api.get('/vacations'),
  
  // Marcar novas férias (Passar employee_id, start, end e work_days)
  create: (data) => api.post('/vacations', data),
  
  // Cancelar marcação
  delete: (id) => api.delete(`/vacations/${id}`),
  
  // Obter férias de um colaborador específico
  getByEmployee: (employeeId) => api.get(`/vacations/employee/${employeeId}`),
};

export default api;