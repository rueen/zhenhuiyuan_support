/** 支持压缩的图片 MIME 类型 */
const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * 在浏览器端用 Canvas 压缩图片
 *
 * @param {File} file 原始文件
 * @param {object} [options]
 * @param {number} [options.quality=0.82] 0~1，JPEG/WebP 质量；PNG 因无损不受此参数影响
 * @param {number} [options.maxWidth=1200]  最大宽度（px），超出则等比缩小
 * @returns {Promise<File>} 压缩后的 File 对象
 *   - PNG 保持 image/png（避免透明底变黑）
 *   - 其余可压缩格式输出 image/jpeg
 *   - SVG / GIF 等不支持格式直接原样返回
 */
export function compressImage(file, { quality = 0.82, maxWidth = 1200 } = {}) {
  if (!COMPRESSIBLE_TYPES.has(file.type)) return Promise.resolve(file)

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width))
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      /** PNG 保留原格式（有透明通道），其余转 JPEG 以利用有损压缩 */
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const outputQuality = file.type === 'image/png' ? undefined : quality

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('canvas.toBlob failed')); return }
          resolve(new File([blob], file.name, { type: outputType, lastModified: Date.now() }))
        },
        outputType,
        outputQuality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      /** 图片解析失败时退回原文件，不阻断上传 */
      resolve(file)
    }

    img.src = objectUrl
  })
}
