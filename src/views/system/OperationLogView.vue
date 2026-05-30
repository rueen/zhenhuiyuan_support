<!--
 * @Author: diaochan diaochan@seatent.com
 * @Date: 2026-05-29 21:04:22
 * @LastEditors: diaochan diaochan@seatent.com
 * @LastEditTime: 2026-05-30 20:51:29
 * @FilePath: /zhenhuiyuan_support/src/views/system/OperationLogView.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOperationLogs } from '@/api/log'

const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })
const filters = reactive({ keyword: '', adminId: '' })

const columns = [
  { title: '操作人', dataIndex: 'admin_username', width: 110 },
  { title: '模块', dataIndex: 'module', width: 110 },
  { title: '动作', dataIndex: 'action', width: 100 },
  { title: '请求路径', dataIndex: 'request_path' },
  { title: '请求参数', dataIndex: 'request_params', key: 'request_params' },
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

/**
 * 将请求参数格式化为缩进 JSON 字符串，容错处理字符串/对象两种类型
 * @param {string|object} val
 * @returns {string}
 */
function formatJson(val) {
  try {
    const obj = typeof val === 'string' ? JSON.parse(val) : val
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(val)
  }
}

/**
 * 将请求参数格式化为缩进 JSON 字符串
 * @param {string|object} val
 * @returns {string}
 */
function formatParams(val) {
  if (val === null || val === undefined || val === '') return '-'
  try {
    const obj = typeof val === 'string' ? JSON.parse(val) : val
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(val)
  }
}
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
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'request_params'">
          <pre v-if="record.request_params" class="json-block">{{ formatJson(record.request_params) }}</pre>
          <span v-else class="empty-tip">—</span>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.json-block {
  margin: 0;
  padding: 6px 8px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 160px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
.empty-tip {
  color: rgba(0, 0, 0, 0.25);
}
</style>
