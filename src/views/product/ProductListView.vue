<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getProducts, deleteProduct, getCategories } from '@/api/product'

const router = useRouter()
const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })
const filters = reactive({ keyword: '', product_no: '', categoryId: undefined, status: undefined })
const categoryOptions = ref([])

const columns = [
  { title: '商品编号', dataIndex: 'product_no' },
  { title: '封面', key: 'cover', width: 80 },
  { title: '商品名称', dataIndex: 'name' },
  { title: '分类', dataIndex: 'category_name' },
  { title: '价格', dataIndex: 'price', width: 100 },
  { title: '库存', dataIndex: 'stock', width: 80 },
  { title: '销量', dataIndex: 'sales', width: 80 },
  { title: '重量(g)', dataIndex: 'weight', width: 90 },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '排序', dataIndex: 'sort', width: 70 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getProducts({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      productNo: filters.product_no || undefined,
      categoryId: filters.categoryId,
      status: filters.status,
    })
    dataSource.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}

async function fetchCategories() {
  const res = await getCategories()
  categoryOptions.value = res
}

onMounted(() => { fetchList(); fetchCategories() })

function onTableChange(pag) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchList()
}

function search() { pagination.current = 1; fetchList() }
function reset() {
  filters.keyword = ''
  filters.product_no = ''
  filters.categoryId = undefined
  filters.status = undefined
  search()
}

function handleDelete(id) {
  Modal.confirm({
    title: '确定删除该商品？',
    onOk: async () => { await deleteProduct(id); message.success('已删除'); fetchList() },
  })
}
</script>

<template>
  <div>
    <div class="action-bar">
      <div class="filter-bar" style="margin-bottom:0">
        <a-input v-model:value="filters.keyword" placeholder="商品名称" style="width:200px" allow-clear />
        <a-input v-model:value="filters.product_no" placeholder="商品编号" style="width:160px" allow-clear />
        <a-select v-model:value="filters.categoryId" placeholder="分类" style="width:130px" allow-clear>
          <a-select-option v-for="c in categoryOptions" :key="c.id" :value="c.id">{{ c.name }}</a-select-option>
        </a-select>
        <a-select v-model:value="filters.status" placeholder="状态" style="width:100px" allow-clear>
          <a-select-option :value="1">上架</a-select-option>
          <a-select-option :value="0">下架</a-select-option>
        </a-select>
        <a-button type="primary" @click="search">查询</a-button>
        <a-button @click="reset">重置</a-button>
      </div>
      <a-button type="primary" @click="router.push('/products/new')">+ 新增商品</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ current: pagination.current, pageSize: pagination.pageSize, total, showTotal: t => `共 ${t} 条`, showSizeChanger: true }"
      row-key="id"
      :scroll="{ x: 1100 }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'cover'">
          <a-image v-if="record.cover" :src="record.cover" :width="48" :height="48" style="object-fit:cover;border-radius:4px" />
          <span v-else style="color:#ccc">无图</span>
        </template>
        <template v-else-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 1 ? 'success' : 'default'">{{ record.status === 1 ? '上架' : '下架' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="router.push(`/products/${record.id}/edit`)">编辑</a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>
