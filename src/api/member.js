import request from '@/utils/request'

export const getMembers = (params) => request.get('/members', { params })
export const getMember = (id) => request.get(`/members/${id}`)
export const getMemberContributionLogs = (id, params) => request.get(`/members/${id}/contribution-logs`, { params })
export const getMemberBalanceLogs = (id, params) => request.get(`/members/${id}/balance-logs`, { params })
export const updateMember = (id, data) => request.put(`/members/${id}`, data)
export const updateMemberParent = (id, data) => request.put(`/members/${id}/parent`, data)
export const updateMemberLevel = (id, data) => request.put(`/members/${id}/level`, data)
export const updateMemberDevice = (id, data) => request.put(`/members/${id}/device`, data)
export const getMemberHealthRecords = (id) => request.get(`/members/${id}/health-records`)
export const adjustMemberContribution = (id, data) => request.post(`/members/${id}/adjust-contribution`, data)
export const adjustMemberBalance = (id, data) => request.post(`/members/${id}/adjust-balance`, data)
