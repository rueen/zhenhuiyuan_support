<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getDividends, createDividend, deleteDividend } from '@/api/dividend'

const router = useRouter()
const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '周期名称', dataIndex: 'period_name' },
  { title: '开始日期', dataIndex: 'start_date', width: 120 },
  { title: '结束日期', dataIndex: 'end_date', width: 120 },
  { title: '销售额', dataIndex: 'sales_amount', width: 120 },
  { title: '分红池', dataIndex: 'pool_amount', width: 120 },
  { title: '生成时间', dataIndex: 'created_at', width: 160 },
  { title: '操作', key: 'action', width: 120 },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getDividends({ page: pagination.current, pageSize: pagination.pageSize })
    dataSource.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}
onMounted(fetchList)

function onTableChange(pag) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchList() }

function handleDelete(id) {
  Modal.confirm({ title: '确定删除该分红周期？', content: '删除后数据不可恢复', onOk: async () => { await deleteDividend(id); message.success('已删除'); fetchList() } })
}

// 生成周期弹窗
const createOpen = ref(false)
const createLoading = ref(false)
const createForm = reactive({ period_name: '', start_date: '', end_date: '' })

async function submitCreate() {
  if (!createForm.period_name || !createForm.start_date || !createForm.end_date) return message.warning('请填写完整信息')
  createLoading.value = true
  try {
    await createDividend({ ...createForm })
    message.success('周期生成成功')
    createOpen.value = false
    createForm.period_name = ''
    createForm.start_date = ''
    createForm.end_date = ''
    fetchList()
  } finally { createLoading.value = false }
}
</script>

<template>
  <div>
    <div class="action-bar">
      <span class="page-title">业绩分红周期</span>
      <a-button type="primary" @click="createOpen = true">+ 生成周期</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ current: pagination.current, pageSize: pagination.pageSize, total, showTotal: t => `共 ${t} 条` }"
      row-key="id"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'period_name'">
          <a @click="router.push(`/dividends/${record.id}`)">{{ record.period_name }}</a>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="router.push(`/dividends/${record.id}`)">详情</a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="createOpen" title="生成分红周期" :confirm-loading="createLoading" @ok="submitCreate">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="周期名称" required>
          <a-input v-model:value="createForm.period_name" placeholder="如 2024年第1季度" />
        </a-form-item>
        <a-form-item label="开始日期" required>
          <a-date-picker
            v-model:value="createForm.start_date"
            value-format="YYYY-MM-DD"
            style="width:100%"
            placeholder="请选择开始日期"
          />
        </a-form-item>
        <a-form-item label="结束日期" required>
          <a-date-picker
            v-model:value="createForm.end_date"
            value-format="YYYY-MM-DD"
            style="width:100%"
            placeholder="请选择结束日期"
            :disabled-date="d => createForm.start_date && d.isBefore(createForm.start_date, 'day')"
          />
        </a-form-item>
        <a-alert message="生成逻辑：统计区间内已完成订单销售额，按等级分红池比例计算各会员应分金额，仅统计不入账" type="info" show-icon />
      </a-form>
    </a-modal>
  </div>
</template>
