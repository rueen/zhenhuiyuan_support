import request from '@/utils/request'

export const getWithdrawals = (params) => request.get('/withdrawals', { params })
export const getWithdrawal = (id) => request.get(`/withdrawals/${id}`)
export const reviewWithdrawal = (id, data) => request.post(`/withdrawals/${id}/review`, data)
export const payWithdrawal = (id, data) => request.post(`/withdrawals/${id}/pay`, data)
