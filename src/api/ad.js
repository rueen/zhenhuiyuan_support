import request from '@/utils/request'

/** 广告位置列表（全量，支持 keyword? 模糊搜索，含各位置广告数量） */
export const getAdPositions = (params) => request.get('/ad-positions', { params })
/** 新建广告位置 */
export const createAdPosition = (data) => request.post('/ad-positions', data)
/** 编辑广告位置 */
export const updateAdPosition = (id, data) => request.put(`/ad-positions/${id}`, data)
/** 删除广告位置（位置下有广告时后端拒绝） */
export const deleteAdPosition = (id) => request.delete(`/ad-positions/${id}`)

/** 广告列表（分页，支持 positionId? / status? / timeStatus? / keyword?） */
export const getAds = (params) => request.get('/ads', { params })
/** 广告详情 */
export const getAd = (id) => request.get(`/ads/${id}`)
/** 新建广告 */
export const createAd = (data) => request.post('/ads', data)
/** 编辑广告 */
export const updateAd = (id, data) => request.put(`/ads/${id}`, data)
/** 删除广告 */
export const deleteAd = (id) => request.delete(`/ads/${id}`)
