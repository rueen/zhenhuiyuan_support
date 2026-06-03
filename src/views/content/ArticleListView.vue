<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getArticles, deleteArticle, getArticleColumns } from '@/api/article'

const router = useRouter()
const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })
const filters = reactive({ keyword: '', columnId: undefined, status: undefined })
const columnOptions = ref([])

const columns = [
  { title: '标题', dataIndex: 'title', ellipsis: true },
  { title: '所属栏目', dataIndex: 'column_name', },
  { title: 'location 标识', dataIndex: 'location', width: 160 },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '创建时间', dataIndex: 'created_at' },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getArticles({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      columnId: filters.columnId,
      status: filters.status,
    })
    dataSource.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function fetchColumns() {
  const res = await getArticleColumns()
  columnOptions.value = Array.isArray(res) ? res : (res.list ?? [])
}

onMounted(() => { fetchList(); fetchColumns() })

function onTableChange(pag) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchList()
}

function search() { pagination.current = 1; fetchList() }
function reset() {
  filters.keyword = ''
  filters.columnId = undefined
  filters.status = undefined
  search()
}

function handleDelete(record) {
  Modal.confirm({
    title: `确定删除文章「${record.title}」？`,
    okType: 'danger',
    onOk: async () => {
      await deleteArticle(record.id)
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
        <a-input
          v-model:value="filters.keyword"
          placeholder="搜索文章标题"
          style="width:200px"
          allow-clear
        />
        <a-select
          v-model:value="filters.columnId"
          placeholder="所属栏目"
          style="width:150px"
          allow-clear
        >
          <a-select-option :value="0">未归栏目</a-select-option>
          <a-select-option v-for="c in columnOptions" :key="c.id" :value="c.id">
            {{ c.name }}
          </a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.status"
          placeholder="状态"
          style="width:100px"
          allow-clear
        >
          <a-select-option :value="1">已发布</a-select-option>
          <a-select-option :value="0">草稿</a-select-option>
        </a-select>
        <a-button type="primary" @click="search">查询</a-button>
        <a-button @click="reset">重置</a-button>
      </div>
      <a-button type="primary" @click="router.push('/content/articles/new')">+ 新增文章</a-button>
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
      :scroll="{ x: 1000 }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 1 ? 'success' : 'default'">
            {{ record.status === 1 ? '已发布' : '草稿' }}
          </a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'location'">
          <span style="color:#aaa;font-size:12px">{{ record.location || '—' }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'column_name'">
          {{ record.column_name || '—' }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button
            type="link"
            size="small"
            @click="router.push(`/content/articles/${record.id}/edit`)"
          >
            编辑
          </a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>
