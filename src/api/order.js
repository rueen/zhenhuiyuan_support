import request from '@/utils/request'

export const getOrders = (params) => request.get('/orders', { params })
export const getOrder = (id) => request.get(`/orders/${id}`)
export const shipOrder = (id, data) => request.post(`/orders/${id}/ship`, data)
export const cancelOrder = (id) => request.post(`/orders/${id}/cancel`)
