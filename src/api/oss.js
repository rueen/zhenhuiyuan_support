import request from '@/utils/request'

export const getOssSignature = () => request.get('/oss/signature')
