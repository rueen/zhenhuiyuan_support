<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import { getAds, deleteAd, getAdPositions } from '@/api/ad'

const router = useRouter()
const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })
const filters = reactive({
  keyword: '',
  positionId: undefined,
  status: undefined,
  timeStatus: undefined,
})
const positionOptions = ref([])

/** 时间状态 Tag 颜色映射 */
const timeStatusMap = {
  not_started: { text: '未开始', color: 'default' },
  active: { text: '进行中', color: 'success' },
  ended: { text: '已结束', color: 'error' },
}

const columns = [
  { title: '标题', dataIndex: 'title', ellipsis: true },
  { title: '广告位置', dataIndex: 'position_name', width: 130 },
  { title: '图片', key: 'image', width: 90 },
  { title: '时间状态', dataIndex: 'time_status', width: 100 },
  { title: '启用', dataIndex: 'status', width: 80 },
  { title: '排序', dataIndex: 'sort', width: 70 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getAds({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      positionId: filters.positionId,
      status: filters.status,
      timeStatus: filters.timeStatus,
    })
    dataSource.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function fetchPositions() {
  const res = await getAdPositions()
  positionOptions.value = Array.isArray(res) ? res : (res.list ?? [])
}

onMounted(() => { fetchList(); fetchPositions() })

function onTableChange(pag) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchList()
}

function search() { pagination.current = 1; fetchList() }
function reset() {
  filters.keyword = ''
  filters.positionId = undefined
  filters.status = undefined
  filters.timeStatus = undefined
  search()
}

function handleDelete(record) {
  Modal.confirm({
    title: `确定删除广告「${record.title}」？`,
    okType: 'danger',
    onOk: async () => {
      await deleteAd(record.id)
      message.success('已删除')
      fetchList()
    },
  })
}
</script>

<template>
  <div>
    <div class="action-bar">
      <div class="filter-bar" style="margin-bottom:0">
        <a-select
          v-model:value="filters.positionId"
          placeholder="广告位置"
          style="width:140px"
          allow-clear
        >
          <a-select-option v-for="p in positionOptions" :key="p.id" :value="p.id">
            {{ p.name }}
          </a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.status"
          placeholder="启用状态"
          style="width:110px"
          allow-clear
        >
          <a-select-option :value="1">启用</a-select-option>
          <a-select-option :value="0">禁用</a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.timeStatus"
          placeholder="时间状态"
          style="width:110px"
          allow-clear
        >
          <a-select-option value="not_started">未开始</a-select-option>
          <a-select-option value="active">进行中</a-select-option>
          <a-select-option value="ended">已结束</a-select-option>
        </a-select>
        <a-input
          v-model:value="filters.keyword"
          placeholder="搜索广告标题"
          style="width:180px"
          allow-clear
        />
        <a-button type="primary" @click="search">查询</a-button>
        <a-button @click="reset">重置</a-button>
      </div>
      <a-space>
        <a-button @click="router.push('/marketing/ad-positions')">
          <template #icon><EnvironmentOutlined /></template>
          广告位置
        </a-button>
        <a-button type="primary" @click="router.push('/marketing/ads/new')">
          <template #icon><PlusOutlined /></template>
          新增广告
        </a-button>
      </a-space>
    </div>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total,
        showTotal: t => `共 ${t} 条`,
        showSizeChanger: true,
      }"
      row-key="id"
      :scroll="{ x: 900 }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'image'">
          <a-image
            v-if="record.image"
            :src="record.image"
            :width="60"
            :height="40"
            style="object-fit:cover;border-radius:4px"
          />
          <span v-else style="color:#ccc">无图</span>
        </template>
        <template v-else-if="column.dataIndex === 'time_status'">
          <a-tag :color="timeStatusMap[record.time_status]?.color">
            {{ timeStatusMap[record.time_status]?.text ?? record.time_status }}
          </a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 1 ? 'success' : 'default'">
            {{ record.status === 1 ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button
            type="link"
            size="small"
            @click="router.push(`/marketing/ads/${record.id}/edit`)"
          >
            编辑
          </a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>
