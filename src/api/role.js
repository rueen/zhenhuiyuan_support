import request from '@/utils/request'

export const getRoles = () => request.get('/roles')
export const getRole = (id) => request.get(`/roles/${id}`)
export const createRole = (data) => request.post('/roles', data)
export const updateRole = (id, data) => request.put(`/roles/${id}`, data)
export const updateRolePermissions = (id, data) => request.put(`/roles/${id}/permissions`, data)
export const deleteRole = (id) => request.delete(`/roles/${id}`)
export const getPermissions = () => request.get('/permissions')
