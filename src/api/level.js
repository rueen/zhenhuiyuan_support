import request from '@/utils/request'

export const getLevels = () => request.get('/levels')
export const createLevel = (data) => request.post('/levels', data)
export const updateLevel = (id, data) => request.put(`/levels/${id}`, data)
export const deleteLevel = (id) => request.delete(`/levels/${id}`)
