import request from '@/utils/request'

export const getOrders = (params) => request.get('/orders', { params })
export const getOrder = (id) => request.get(`/orders/${id}`)
export const updateShipments = (id, shipments) => request.put(`/orders/${id}/shipments`, { shipments })
export const cancelOrder = (id) => request.post(`/orders/${id}/cancel`)
export const getLogisticsCompanies = () => request.get('/orders/logistics-companies')
export const getShipmentTrack = (orderId, shipmentId) => request.get(`/orders/${orderId}/shipments/${shipmentId}/track`)
export const updateOrderReceiver = (id, data) => request.put(`/orders/${id}/receiver`, data)
