<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getConfigs, updateConfigs } from '@/api/config'

const loading = ref(false)
const saveLoading = ref(false)

// 配置项映射 key → 当前值
const configValues = ref({
  'contribution.coefficient': '',
  'contribution.self_rate': '',
  'contribution.direct_rate': '',
  'contribution.indirect_rate': '',
  'withdrawal.min_amount': '',
  'dividend.pool_extract_rate': '',
  'dividend.charity_rate': '',
})

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
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="自购贡献率">
                <a-input v-model:value="configValues['contribution.self_rate']" placeholder="如 0.30" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="直推贡献率">
                <a-input v-model:value="configValues['contribution.direct_rate']" placeholder="如 0.20" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="间推贡献率">
                <a-input v-model:value="configValues['contribution.indirect_rate']" placeholder="如 0.10" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

      <a-card title="提现配置" style="margin-bottom:16px">
        <a-form layout="vertical">
          <a-col :span="6">
            <a-form-item label="最低提现金额（元）">
              <a-input v-model:value="configValues['withdrawal.min_amount']" placeholder="如 100.00" />
            </a-form-item>
          </a-col>
        </a-form>
      </a-card>

      <a-card title="分红配置" style="margin-bottom:24px">
        <a-form layout="vertical">
          <a-row :gutter="24">
            <a-col :span="6">
              <a-form-item label="分红池提取比例">
                <a-input v-model:value="configValues['dividend.pool_extract_rate']" placeholder="如 0.10" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="公益比例">
                <a-input v-model:value="configValues['dividend.charity_rate']" placeholder="如 0.02" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

      <a-button type="primary" :loading="saveLoading" @click="saveAll">保存全部配置</a-button>
    </a-spin>
  </div>
</template>
