<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDividend } from '@/api/dividend'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const loading = ref(false)
const data = ref(null)

const memberColumns = [
  { title: '会员ID', dataIndex: 'member_id', width: 90 },
  { title: '昵称', dataIndex: 'nickname' },
  { title: '等级', dataIndex: 'level_name', width: 100 },
  { title: '周期贡献值', dataIndex: 'member_contribution', width: 120 },
  { title: '应分金额', dataIndex: 'share_amount', width: 120 },
]

const levelColumns = [
  { title: '等级', dataIndex: 'level_name' },
  { title: '分红池比例', dataIndex: 'pool_rate' },
  { title: '等级池金额', dataIndex: 'level_pool_amount' },
]

async function fetchData() {
  loading.value = true
  try { data.value = await getDividend(id) } finally { loading.value = false }
}
onMounted(fetchData)
</script>

<template>
  <div>
    <a-page-header title="分红周期详情" @back="router.push('/dividends')" style="padding:0 0 16px" />
    <a-spin :spinning="loading">
      <template v-if="data">
        <a-descriptions title="周期信息" bordered :column="2" style="margin-bottom:24px">
          <a-descriptions-item label="周期名称">{{ data.period.period_name }}</a-descriptions-item>
          <a-descriptions-item label="统计区间">{{ data.period.start_date }} ~ {{ data.period.end_date }}</a-descriptions-item>
          <a-descriptions-item label="周期销售额">{{ data.period.total_sales }}</a-descriptions-item>
          <a-descriptions-item label="总分红池">{{ data.period.pool_amount }}</a-descriptions-item>
          <a-descriptions-item label="生成时间">{{ data.period.created_at }}</a-descriptions-item>
        </a-descriptions>

        <a-card title="各等级分池" :bordered="false" size="small" style="margin-bottom:16px">
          <a-table
            :columns="levelColumns"
            :data-source="data.levels"
            row-key="id"
            :pagination="false"
            size="small"
          />
        </a-card>

        <a-card title="会员应分明细" :bordered="false" size="small">
          <a-table
            :columns="memberColumns"
            :data-source="data.members"
            row-key="member_id"
            :pagination="{ pageSize: 20, showTotal: t => `共 ${t} 条` }"
            size="small"
          />
        </a-card>
      </template>
    </a-spin>
  </div>
</template>
