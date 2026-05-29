import request from '@/utils/request'

export const getConfigs = () => request.get('/configs')
export const updateConfigs = (data) => request.put('/configs', data)
