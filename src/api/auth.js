import request from '@/utils/request'

export const login = (data) => request.post('/auth/login', data)
export const getProfile = () => request.get('/auth/profile')
export const changePassword = (id, data) => request.put(`/admins/${id}/password`, data)
