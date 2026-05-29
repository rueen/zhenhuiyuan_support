import request from '@/utils/request'

export const getShippingTemplates = () => request.get('/shipping-templates')
export const getShippingTemplate = (id) => request.get(`/shipping-templates/${id}`)
export const createShippingTemplate = (data) => request.post('/shipping-templates', data)
export const updateShippingTemplate = (id, data) => request.put(`/shipping-templates/${id}`, data)
export const deleteShippingTemplate = (id) => request.delete(`/shipping-templates/${id}`)
