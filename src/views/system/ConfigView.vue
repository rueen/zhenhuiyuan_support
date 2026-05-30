<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getConfigs, updateConfigs } from '@/api/config'

const loading = ref(false)
const saveLoading = ref(false)

/** 配置项映射 key → 当前值 */
const configValues = ref({
  'contribution.coefficient': '',
  'contribution.self_rate': '',
  'contribution.direct_rate': '',
  'contribution.indirect_rate': '',
  'withdrawal.min_amount': '',
  'dividend.pool_extract_rate': '',
  'dividend.charity_rate': '',
})

/**
 * 以 100 元订单为例，实时计算各角色获得的贡献值
 * 公式：贡献值 = 订单金额(100) × 贡献值系数 × 对应比率
 */
const contributionExample = computed(() => {
  const ORDER = 100
  const coef = parseFloat(configValues.value['contribution.coefficient']) || 0
  const selfRate = parseFloat(configValues.value['contribution.self_rate']) || 0
  const directRate = parseFloat(configValues.value['contribution.direct_rate']) || 0
  const indirectRate = parseFloat(configValues.value['contribution.indirect_rate']) || 0

  const fmt = (n) => parseFloat(n.toFixed(2))

  return {
    self: fmt(ORDER * coef * selfRate),
    direct: fmt(ORDER * coef * directRate),
    indirect: fmt(ORDER * coef * indirectRate),
    coef,
    selfRate,
    directRate,
    indirectRate,
  }
})

/** 将小数比率转换为百分比字符串，如 0.1 → 10% */
const toPercent = (val) => {
  const n = parseFloat(val)
  if (isNaN(n)) return '—'
  return (n * 100).toFixed(0) + '%'
}

async function fetchConfigs() {
  loading.value = true
  try {
    const list = await getConfigs()
    // list: [{ config_key, config_value }] 或 key-value 对象，兼容两种格式
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (item.config_key in configValues.value) {
          configValues.value[item.config_key] = item.config_value
        }
      })
    } else {
      Object.keys(configValues.value).forEach(k => {
        if (list[k] !== undefined) configValues.value[k] = list[k]
      })
    }
  } finally { loading.value = false }
}
onMounted(fetchConfigs)

async function saveAll() {
  saveLoading.value = true
  try {
    const items = Object.entries(configValues.value).map(([config_key, config_value]) => ({ config_key, config_value }))
    await updateConfigs({ items })
    message.success('配置已保存')
  } finally { saveLoading.value = false }
}
</script>

<template>
  <div>
    <a-spin :spinning="loading">
      <a-card title="贡献值配置" style="margin-bottom:16px">
        <a-form layout="vertical">
          <a-row :gutter="24">
            <a-col :span="6">
              <a-form-item label="贡献值系数">
                <a-input v-model:value="configValues['contribution.coefficient']" placeholder="如 1.0" />
                <div style="font-size:12px;color:#888;margin-top:4px">相当于倍率，1 = 正常计算，2 = 双倍活动（所有人贡献值翻倍）</div>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="自购贡献率">
                <a-input v-model:value="configValues['contribution.self_rate']" placeholder="如 0.10" />
                <div style="font-size:12px;color:#888;margin-top:4px">自己买东西，按消费金额的此比例返还贡献值（小数，如 0.10 = 10%）</div>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="直推贡献率">
                <a-input v-model:value="configValues['contribution.direct_rate']" placeholder="如 0.05" />
                <div style="font-size:12px;color:#888;margin-top:4px">直接介绍的人（一级下线）消费，上级可获得贡献值的比例</div>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="间推贡献率">
                <a-input v-model:value="configValues['contribution.indirect_rate']" placeholder="如 0.02" />
                <div style="font-size:12px;color:#888;margin-top:4px">间接介绍的人（二级及以下下线）消费，上级可获得贡献值的比例</div>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>

        <!-- 100 元订单实时举例 -->
        <a-divider style="margin:12px 0" />
        <div style="font-size:13px;color:#555;margin-bottom:8px">
          <strong>举例说明（以 100 元订单为例）</strong>
          — 层级关系：A 推荐了 B，B 推荐了 C，C 购买了 100 元商品
        </div>
        <div style="font-size:12px;color:#888;margin-bottom:10px;padding:8px 12px;background:#fafafa;border-radius:6px;border:1px solid #f0f0f0">
          当前配置：贡献值系数 = <b>{{ contributionExample.coef || '—' }}</b>，
          自购 = <b>{{ toPercent(configValues['contribution.self_rate']) }}</b>，
          直推 = <b>{{ toPercent(configValues['contribution.direct_rate']) }}</b>，
          间推 = <b>{{ toPercent(configValues['contribution.indirect_rate']) }}</b>
        </div>
        <a-table
          :dataSource="[
            { key:'C', role:'C（自己）', type:'购买者（自购）', formula:`100 × ${contributionExample.coef || '?'} × ${toPercent(configValues['contribution.self_rate'])}`, points: contributionExample.self },
            { key:'B', role:'B', type:'直推上级', formula:`100 × ${contributionExample.coef || '?'} × ${toPercent(configValues['contribution.direct_rate'])}`, points: contributionExample.direct },
            { key:'A', role:'A', type:'间推上级', formula:`100 × ${contributionExample.coef || '?'} × ${toPercent(configValues['contribution.indirect_rate'])}`, points: contributionExample.indirect },
          ]"
          :columns="[
            { title:'受益人', dataIndex:'role', width:100 },
            { title:'角色', dataIndex:'type', width:130 },
            { title:'计算公式', dataIndex:'formula' },
            { title:'获得贡献值', dataIndex:'points', width:110, align:'right' },
          ]"
          size="small"
          :pagination="false"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'points'">
              <span style="font-weight:600;color:#1677ff">{{ record.points }} 点</span>
            </template>
          </template>
        </a-table>
        <div style="font-size:12px;color:#aaa;margin-top:6px">* 修改上方配置后，此处自动更新计算结果。贡献值只增不减，不能提现，主要用于累积会员等级。</div>
      </a-card>

      <a-card title="提现配置" style="margin-bottom:16px">
        <a-form layout="vertical">
          <a-row :gutter="24">
            <a-col :span="6">
              <a-form-item label="最低提现金额（元）">
                <a-input v-model:value="configValues['withdrawal.min_amount']" placeholder="如 100.00" />
                <div style="font-size:12px;color:#888;margin-top:4px">用户发起提现时，单次最低需达到此金额才能提交申请</div>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

      <a-card title="分红配置" style="margin-bottom:24px">
        <a-form layout="vertical">
          <a-row :gutter="24">
            <a-col :span="6">
              <a-form-item label="分红池提取比例">
                <a-input v-model:value="configValues['dividend.pool_extract_rate']" placeholder="如 0.10" />
                <div style="font-size:12px;color:#888;margin-top:4px">分红池 = 周期销售额 × 此比例</div>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="公益比例">
                <a-input v-model:value="configValues['dividend.charity_rate']" placeholder="如 0.02" />
                <div style="font-size:12px;color:#888;margin-top:4px">从分红池中划拨给公益基金的比例（小数，如 0.02 = 2%）</div>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

      <a-button type="primary" :loading="saveLoading" @click="saveAll">保存全部配置</a-button>
    </a-spin>
  </div>
</template>
