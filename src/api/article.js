import request from '@/utils/request'

/** 栏目列表（全量，支持 keyword? 模糊搜索） */
export const getArticleColumns = (params) => request.get('/article-columns', { params })
/** 新建栏目 */
export const createArticleColumn = (data) => request.post('/article-columns', data)
/** 编辑栏目 */
export const updateArticleColumn = (id, data) => request.put(`/article-columns/${id}`, data)
/** 删除栏目 */
export const deleteArticleColumn = (id) => request.delete(`/article-columns/${id}`)

/** 文章列表（分页，支持 columnId? / keyword? / status?） */
export const getArticles = (params) => request.get('/articles', { params })
/** 文章详情（含 content） */
export const getArticle = (id) => request.get(`/articles/${id}`)
/** 新建文章 */
export const createArticle = (data) => request.post('/articles', data)
/** 编辑文章 */
export const updateArticle = (id, data) => request.put(`/articles/${id}`, data)
/** 删除文章 */
export const deleteArticle = (id) => request.delete(`/articles/${id}`)
