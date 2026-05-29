<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrders } from '@/api/order'

const router = useRouter()
const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })
const filters = reactive({ keyword: '', status: undefined })

const STATUS_MAP = {
  0: ['待付款', 'default'],
  1: ['待发货', 'processing'],
  2: ['待收货', 'warning'],
  3: ['已完成', 'success'],
  4: ['已取消', 'error'],
}

const columns = [
  { title: '订单号', dataIndex: 'order_no', width: 180 },
  { title: '会员ID', dataIndex: 'member_id', width: 90 },
  { title: '商品金额', dataIndex: 'product_amount', width: 110 },
  { title: '运费', dataIndex: 'shipping_fee', width: 90 },
  { title: '实付', dataIndex: 'pay_amount', width: 100 },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '下单时间', dataIndex: 'created_at', width: 160 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getOrders({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      status: filters.status,
    })
    dataSource.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}

onMounted(fetchList)

function onTableChange(pag) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchList() }
function search() { pagination.current = 1; fetchList() }
function reset() { filters.keyword = ''; filters.status = undefined; search() }
</script>

<template>
  <div>
    <div class="filter-bar">
      <a-input v-model:value="filters.keyword" placeholder="订单号 / 会员ID" style="width:220px" allow-clear />
      <a-select v-model:value="filters.status" placeholder="订单状态" style="width:130px" allow-clear>
        <a-select-option v-for="(v, k) in STATUS_MAP" :key="k" :value="Number(k)">{{ v[0] }}</a-select-option>
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
      :scroll="{ x: 1000 }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="STATUS_MAP[record.status]?.[1]">{{ STATUS_MAP[record.status]?.[0] }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="router.push(`/orders/${record.id}`)">详情</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>
