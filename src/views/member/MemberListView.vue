<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMembers } from '@/api/member'
import { getLevels } from '@/api/level'

const router = useRouter()

// 列表数据
const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })

// 筛选
const filters = reactive({ keyword: '', levelId: undefined, status: undefined })

// 等级选项
const levelOptions = ref([])

const columns = [
  { title: '昵称', dataIndex: 'nickname' },
  { title: '手机号', dataIndex: 'phone' },
  { title: '等级', dataIndex: 'level_name' },
  { title: '贡献值', dataIndex: 'cumulative_contribution', width: 100 },
  { title: '可提余额', dataIndex: 'withdrawable_balance', width: 110 },
  { title: '邀请码', dataIndex: 'invite_code', width: 110 },
  { title: '上级', dataIndex: 'parent_nickname', width: 90 },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '注册时间', dataIndex: 'created_at', width: 160 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getMembers({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      levelId: filters.levelId,
      status: filters.status,
    })
    dataSource.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function fetchLevels() {
  const res = await getLevels()
  levelOptions.value = res
}

onMounted(() => { fetchList(); fetchLevels() })

function onTableChange(pag) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchList()
}

function search() { pagination.current = 1; fetchList() }
function reset() { filters.keyword = ''; filters.levelId = undefined; filters.status = undefined; search() }
</script>

<template>
  <div>
    <div class="filter-bar">
      <a-input v-model:value="filters.keyword" placeholder="昵称 / 手机 / 邀请码" style="width:220px" allow-clear />
      <a-select v-model:value="filters.levelId" placeholder="等级" style="width:130px" allow-clear>
        <a-select-option v-for="lv in levelOptions" :key="lv.id" :value="lv.id">{{ lv.name }}</a-select-option>
      </a-select>
      <a-select v-model:value="filters.status" placeholder="状态" style="width:100px" allow-clear>
        <a-select-option :value="1">正常</a-select-option>
        <a-select-option :value="0">禁用</a-select-option>
      </a-select>
      <a-button type="primary" @click="search">查询</a-button>
      <a-button @click="reset">重置</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ current: pagination.current, pageSize: pagination.pageSize, total, showTotal: t => `共 ${t} 条`, showSizeChanger: true }"
      row-key="id"
      :scroll="{ x: 1200 }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 1 ? 'success' : 'default'">
            {{ record.status === 1 ? '正常' : '禁用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="router.push(`/members/${record.id}`)">详情</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>
