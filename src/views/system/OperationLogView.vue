<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOperationLogs } from '@/api/log'

const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })
const filters = reactive({ keyword: '', adminId: '' })

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '操作人', dataIndex: 'admin_name', width: 110 },
  { title: '模块', dataIndex: 'module', width: 110 },
  { title: '动作', dataIndex: 'action', width: 100 },
  { title: '请求路径', dataIndex: 'path' },
  { title: 'IP', dataIndex: 'ip', width: 130 },
  { title: '操作时间', dataIndex: 'created_at', width: 160 },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getOperationLogs({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      adminId: filters.adminId || undefined,
    })
    dataSource.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}
onMounted(fetchList)

function onTableChange(pag) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchList() }
function search() { pagination.current = 1; fetchList() }
function reset() { filters.keyword = ''; filters.adminId = ''; search() }
</script>

<template>
  <div>
    <div class="filter-bar" style="margin-bottom:16px">
      <a-input v-model:value="filters.keyword" placeholder="关键词" style="width:200px" allow-clear />
      <a-input v-model:value="filters.adminId" placeholder="管理员ID" style="width:140px" allow-clear />
      <a-button type="primary" @click="search">查询</a-button>
      <a-button @click="reset">重置</a-button>
    </div>
    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ current: pagination.current, pageSize: pagination.pageSize, total, showTotal: t => `共 ${t} 条`, showSizeChanger: true }"
      row-key="id"
      :scroll="{ x: 900 }"
      @change="onTableChange"
    />
  </div>
</template>
