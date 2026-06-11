import areaData from 'china-area-data'

/**
 * 将 china-area-data 扁平结构转为 a-cascader 所需的树形结构
 * 每项格式：{ value: code, label: name, children: [...] }
 * @returns {Array}
 */
export function buildRegionOptions() {
  return Object.entries(areaData['86']).map(([provCode, provName]) => {
    const cities = areaData[provCode] ?? {}
    return {
      value: provCode,
      label: provName,
      children: Object.entries(cities).map(([cityCode, cityName]) => {
        const districts = areaData[cityCode] ?? {}
        const distChildren = Object.entries(districts).map(([distCode, distName]) => ({
          value: distCode,
          label: distName,
        }))
        return {
          value: cityCode,
          label: cityName,
          children: distChildren.length ? distChildren : undefined,
        }
      }),
    }
  })
}
