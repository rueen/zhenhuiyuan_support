import request from '@/utils/request'

export const getAdmins = (params) => request.get('/admins', { params })
export const createAdmin = (data) => request.post('/admins', data)
export const updateAdmin = (id, data) => request.put(`/admins/${id}`, data)
export const updateAdminStatus = (id, data) => request.put(`/admins/${id}/status`, data)
export const resetAdminPassword = (id, data) => request.put(`/admins/${id}/password`, data)
export const deleteAdmin = (id) => request.delete(`/admins/${id}`)
