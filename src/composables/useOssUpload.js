import { getOssSignature } from '@/api/oss'
import { compressImage } from '@/utils/imageCompress'

/**
 * OSS 直传 Composable（含上传前图片压缩）
 *
 * @param {string} dir OSS 目录，如 'products'、'ads'、'vouchers'
 * @param {object} [compressOptions] 传给 compressImage 的参数
 * @param {number} [compressOptions.quality=0.82] 压缩质量 0~1
 * @param {number} [compressOptions.maxWidth=1200]  最大宽度（px）
 * @returns {{ customUpload: Function }} 直接绑定到 a-upload :custom-request
 */
export function useOssUpload(dir, compressOptions = {}) {
  /**
   * 供 a-upload :custom-request 使用的上传函数
   * @param {{ file: File, onSuccess: Function, onError: Function }} param
   */
  async function customUpload({ file, onSuccess, onError }) {
    try {
      const compressed = await compressImage(file, compressOptions)
      const sig = await getOssSignature(dir)
      const formData = new FormData()
      const key = `${sig.dir}${Date.now()}_${compressed.name}`
      formData.append('key', key)
      formData.append('OSSAccessKeyId', sig.accessKeyId)
      formData.append('policy', sig.policy)
      formData.append('signature', sig.signature)
      formData.append('success_action_status', '200')
      formData.append('file', compressed)
      await fetch(sig.host, { method: 'POST', body: formData })
      const url = `${sig.host}/${key}`
      onSuccess({ url }, compressed)
    } catch (e) {
      onError(e)
    }
  }

  return { customUpload }
}
