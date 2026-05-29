import request from '@/utils/request'

export const getDividends = (params) => request.get('/dividends', { params })
export const getDividend = (id) => request.get(`/dividends/${id}`)
export const createDividend = (data) => request.post('/dividends', data)
export const deleteDividend = (id) => request.delete(`/dividends/${id}`)
