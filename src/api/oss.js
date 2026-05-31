import request from '@/utils/request'

/**
 * 获取 OSS 上传签名
 * @param {string} [dir] 上传目录，如 'products'、'vouchers'、'avatar'，不传则使用服务端默认目录
 */
export const getOssSignature = (dir) =>
  request.get('/oss/signature', { params: dir ? { dir } : undefined })
