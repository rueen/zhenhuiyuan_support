import request from '@/utils/request'

export const getMembers = (params) => request.get('/members', { params })
export const getMember = (id) => request.get(`/members/${id}`)
export const getMemberContributionLogs = (id, params) => request.get(`/members/${id}/contribution-logs`, { params })
export const getMemberBalanceLogs = (id, params) => request.get(`/members/${id}/balance-logs`, { params })
export const updateMember = (id, data) => request.put(`/members/${id}`, data)
export const updateMemberParent = (id, data) => request.put(`/members/${id}/parent`, data)
export const updateMemberLevel = (id, data) => request.put(`/members/${id}/level`, data)
