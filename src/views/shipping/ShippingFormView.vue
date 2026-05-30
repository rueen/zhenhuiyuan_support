<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons-vue'
import { getShippingTemplate, createShippingTemplate, updateShippingTemplate } from '@/api/shipping'
import ProvinceSelector from '@/components/ProvinceSelector.vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const pageLoading = ref(false)
const submitLoading = ref(false)

const form = reactive({
  name: '',
  is_default: 0,
  rules: [],
})

function addRule() {
  form.rules.push({
    region_codes: [],
    is_default_group: 0,
    first_weight: 1000,
    first_fee: '10.00',
    additional_weight: 500,
    additional_fee: '5.00',
  })
}

function removeRule(index) {
  form.rules.splice(index, 1)
}

/**
 * 获取除当前规则外，其他区域规则已选中的省份编码（用于禁止重复勾选）
 * @param {number} currentIndex - 当前规则的索引
 * @returns {string[]}
 */
function getOccupiedCodes(currentIndex) {
  return form.rules
    .filter((r, i) => i !== currentIndex && !r.is_default_group)
    .flatMap(r => r.region_codes)
}

async function fetchTemplate() {
  if (!isEdit.value) { addRule(); return }
  pageLoading.value = true
  try {
    const data = await getShippingTemplate(route.params.id)
    form.name = data.name
    form.is_default = data.is_default ?? 0
    form.rules = data.rules || []
    if (!form.rules.length) addRule()
  } finally { pageLoading.value = false }
}

onMounted(fetchTemplate)

async function submit() {
  if (!form.name) return message.warning('请输入模板名称')
  if (!form.rules.length) return message.warning('请至少添加一条计费规则')
  submitLoading.value = true
  try {
    const payload = { name: form.name, is_default: form.is_default, rules: form.rules }
    if (isEdit.value) {
      await updateShippingTemplate(route.params.id, payload)
      message.success('修改成功')
    } else {
      await createShippingTemplate(payload)
      message.success('新增成功')
    }
    router.push('/shipping')
  } finally { submitLoading.value = false }
}
</script>

<template>
  <div>
    <a-page-header :title="isEdit ? '编辑运费模板' : '新增运费模板'" @back="router.push('/shipping')" style="padding:0 0 16px" />
    <a-spin :spinning="pageLoading">
      <a-form layout="vertical">
        <a-form-item label="模板名称" required>
          <a-input v-model:value="form.name" placeholder="请输入模板名称" style="max-width:400px" />
        </a-form-item>

        <a-form-item label="是否默认">
          <a-switch
            v-model:checked="form.is_default"
            :checked-value="1"
            :un-checked-value="0"
            checked-children="默认"
            un-checked-children="非默认"
          />
          <span style="margin-left:10px;color:rgba(0,0,0,.45);font-size:13px">
            设为默认后，下单时将优先使用此模板
          </span>
        </a-form-item>

        <a-form-item label="计费规则">
          <div v-for="(rule, index) in form.rules" :key="index" class="rule-item">
            <div class="rule-header">
              <span class="rule-index">规则 {{ index + 1 }}</span>
              <a-switch v-model:checked="rule.is_default_group" :checked-value="1" :un-checked-value="0" checked-children="默认规则" un-checked-children="区域规则" />
              <a-button type="text" danger @click="removeRule(index)"><MinusCircleOutlined /></a-button>
            </div>
            <a-row :gutter="16">
              <a-col :span="6">
                <a-form-item label="首重（g）">
                  <a-input-number v-model:value="rule.first_weight" :min="1" style="width:100%" />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="首费（元）">
                  <a-input v-model:value="rule.first_fee" placeholder="如 10.00" />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="续重（g）">
                  <a-input-number v-model:value="rule.additional_weight" :min="1" style="width:100%" />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="续费（元）">
                  <a-input v-model:value="rule.additional_fee" placeholder="如 5.00" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item v-if="!rule.is_default_group" label="适用省份">
              <ProvinceSelector
                v-model="rule.region_codes"
                :disabled-codes="getOccupiedCodes(index)"
              />
            </a-form-item>
          </div>
          <a-button type="dashed" @click="addRule" style="width:100%;margin-top:8px">
            <PlusOutlined /> 添加规则
          </a-button>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="submitLoading" @click="submit">
              {{ isEdit ? '保存修改' : '立即创建' }}
            </a-button>
            <a-button @click="router.push('/shipping')">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<style lang="less" scoped>
.rule-item {
  padding: 16px;
  margin-bottom: 12px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}
.rule-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.rule-index {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
}
</style>
