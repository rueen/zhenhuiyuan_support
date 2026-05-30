<script setup>
import { computed } from 'vue'

/**
 * 大区与省份映射（无交叉，共 31 省）
 * 顺序与省份网格显示顺序对应
 * @type {Array<{label:string, provinces:{label:string,code:string}[]}>}
 */
const REGIONS = [
  {
    label: '华东',
    provinces: [
      { label: '上海市',   code: '310000' },
      { label: '江苏省',   code: '320000' },
      { label: '浙江省',   code: '330000' },
      { label: '安徽省',   code: '340000' },
      { label: '福建省',   code: '350000' },
      { label: '江西省',   code: '360000' },
      { label: '山东省',   code: '370000' },
    ],
  },
  {
    label: '华南',
    provinces: [
      { label: '广东省',         code: '440000' },
      { label: '广西壮族自治区', code: '450000' },
      { label: '海南省',         code: '460000' },
    ],
  },
  {
    label: '华北',
    provinces: [
      { label: '北京市', code: '110000' },
      { label: '天津市', code: '120000' },
      { label: '河北省', code: '130000' },
      { label: '山西省', code: '140000' },
    ],
  },
  {
    label: '华中',
    provinces: [
      { label: '河南省', code: '410000' },
      { label: '湖北省', code: '420000' },
      { label: '湖南省', code: '430000' },
    ],
  },
  {
    label: '西南',
    provinces: [
      { label: '重庆市', code: '500000' },
      { label: '四川省', code: '510000' },
      { label: '贵州省', code: '520000' },
      { label: '云南省', code: '530000' },
    ],
  },
  {
    label: '西北',
    provinces: [
      { label: '陕西省', code: '610000' },
    ],
  },
  {
    label: '东北',
    provinces: [
      { label: '辽宁省',   code: '210000' },
      { label: '吉林省',   code: '220000' },
      { label: '黑龙江省', code: '230000' },
    ],
  },
  {
    label: '偏远地区',
    provinces: [
      { label: '新疆维吾尔自治区', code: '650000' },
      { label: '西藏自治区',       code: '540000' },
      { label: '青海省',           code: '630000' },
      { label: '内蒙古自治区',     code: '150000' },
      { label: '甘肃省',           code: '620000' },
      { label: '宁夏回族自治区',   code: '640000' },
    ],
  },
]

/**
 * 省份网格展示顺序（固定布局，与截图一致）
 * 华东7 → 华南3 → 华北4 → 华中3 → 西南4 → 西北1 → 东北3 → 偏远6 = 31
 */
const ALL_PROVINCES = REGIONS.flatMap(r => r.provinces)

const props = defineProps({
  /** 当前规则已选省份编码 */
  modelValue: { type: Array, default: () => [] },
  /** 其他规则已占用的省份编码（禁止重复勾选） */
  disabledCodes: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

/**
 * 计算大区复选框的勾选状态
 * @param {{ provinces: {code:string}[] }} region
 * @returns {{ checked: boolean, indeterminate: boolean, disabled: boolean }}
 */
function regionState(region) {
  const available = region.provinces.filter(p => !props.disabledCodes.includes(p.code))
  if (!available.length) return { checked: false, indeterminate: false, disabled: true }
  const selectedCount = available.filter(p => props.modelValue.includes(p.code)).length
  return {
    checked: selectedCount === available.length,
    indeterminate: selectedCount > 0 && selectedCount < available.length,
    disabled: false,
  }
}

/**
 * 切换整个大区的选中状态
 * @param {{ provinces: {code:string}[] }} region
 * @param {boolean} checked
 */
function toggleRegion(region, checked) {
  const available = region.provinces
    .filter(p => !props.disabledCodes.includes(p.code))
    .map(p => p.code)
  let next = [...props.modelValue]
  if (checked) {
    available.forEach(c => { if (!next.includes(c)) next.push(c) })
  } else {
    next = next.filter(c => !available.includes(c))
  }
  emit('update:modelValue', next)
}

/**
 * 切换单个省份的选中状态
 * @param {string} code
 * @param {boolean} checked
 */
function toggleProvince(code, checked) {
  let next = [...props.modelValue]
  if (checked) {
    if (!next.includes(code)) next.push(code)
  } else {
    next = next.filter(c => c !== code)
  }
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="province-selector">
    <!-- 快捷选区 -->
    <div class="shortcut-row">
      <span class="shortcut-label">快捷选区：</span>
      <a-checkbox
        v-for="region in REGIONS"
        :key="region.label"
        :checked="regionState(region).checked"
        :indeterminate="regionState(region).indeterminate"
        :disabled="regionState(region).disabled"
        @change="e => toggleRegion(region, e.target.checked)"
      >{{ region.label }}</a-checkbox>
    </div>

    <!-- 省份列表 -->
    <div class="province-section">
      <div class="province-section-label">包含省份</div>
      <div class="province-grid">
        <a-checkbox
          v-for="p in ALL_PROVINCES"
          :key="p.code"
          :checked="modelValue.includes(p.code)"
          :disabled="disabledCodes.includes(p.code)"
          @change="e => toggleProvince(p.code, e.target.checked)"
        >{{ p.label }}</a-checkbox>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.province-selector {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px 14px;
  background: #fff;
}

.shortcut-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e8e8e8;
  margin-bottom: 10px;
}

.shortcut-label {
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}

.province-section-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 8px;
}

.province-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 8px 0;
}
</style>
