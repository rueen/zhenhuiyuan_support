<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getMember, getMemberContributionLogs, getMemberBalanceLogs } from '@/api/member'

const route = useRoute()
const id = route.params.id

const info = ref(null)
const infoLoading = ref(false)

// 贡献值流水
const contribs = ref([])
const contribTotal = ref(0)
const contribPage = ref(1)
const contribLoading = ref(false)

// 余额流水
const balances = ref([])
const balanceTotal = ref(0)
const balancePage = ref(1)
const balanceLoading = ref(false)

const contribColumns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '变动值', dataIndex: 'amount' },
  { title: '当前总贡献值', dataIndex: 'current_contribution' },
  { title: '来源订单', dataIndex: 'order_id' },
  { title: '类型', dataIndex: 'type' },
  { title: '说明', dataIndex: 'remark' },
  { title: '时间', dataIndex: 'created_at', width: 160 },
]

const balanceColumns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '变动金额', dataIndex: 'amount' },
  { title: '当前余额', dataIndex: 'current_balance' },
  { title: '类型', dataIndex: 'type' },
  { title: '来源', dataIndex: 'source' },
  { title: '说明', dataIndex: 'remark' },
  { title: '时间', dataIndex: 'created_at', width: 160 },
]

async function fetchInfo() {
  infoLoading.value = true
  try { info.value = await getMember(id) } finally { infoLoading.value = false }
}

async function fetchContribs(page = 1) {
  contribLoading.value = true
  try {
    const res = await getMemberContributionLogs(id, { page, pageSize: 20 })
    contribs.value = res.list
    contribTotal.value = res.total
    contribPage.value = page
  } finally { contribLoading.value = false }
}

async function fetchBalances(page = 1) {
  balanceLoading.value = true
  try {
    const res = await getMemberBalanceLogs(id, { page, pageSize: 20 })
    balances.value = res.list
    balanceTotal.value = res.total
    balancePage.value = page
  } finally { balanceLoading.value = false }
}

onMounted(() => { fetchInfo(); fetchContribs(); fetchBalances() })
</script>

<template>
  <div>
    <a-skeleton :loading="infoLoading" active>
      <template v-if="info">
        <a-descriptions title="基本信息" bordered :column="2" style="margin-bottom:24px">
          <a-descriptions-item label="ID">{{ info.id }}</a-descriptions-item>
          <a-descriptions-item label="昵称">{{ info.nickname }}</a-descriptions-item>
          <a-descriptions-item label="手机号">{{ info.phone }}</a-descriptions-item>
          <a-descriptions-item label="等级">{{ info.level_name }}</a-descriptions-item>
          <a-descriptions-item label="累计贡献值">{{ info.cumulative_contribution }}</a-descriptions-item>
          <a-descriptions-item label="可提现余额">{{ info.withdrawable_balance }}</a-descriptions-item>
          <a-descriptions-item label="邀请码">{{ info.invite_code }}</a-descriptions-item>
          <a-descriptions-item label="上级ID">{{ info.parent_id || '—' }}</a-descriptions-item>
          <a-descriptions-item label="首次消费时间">{{ info.first_consumed_at || '未消费' }}</a-descriptions-item>
          <a-descriptions-item label="注册时间">{{ info.created_at }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="info.status === 1 ? 'success' : 'default'">{{ info.status === 1 ? '正常' : '禁用' }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-skeleton>

    <a-tabs>
      <a-tab-pane key="contrib" tab="贡献值流水">
        <a-table
          :columns="contribColumns"
          :data-source="contribs"
          :loading="contribLoading"
          :pagination="{ current: contribPage, total: contribTotal, pageSize: 20, showTotal: t => `共 ${t} 条` }"
          row-key="id"
          @change="(p) => fetchContribs(p.current)"
        />
      </a-tab-pane>
      <a-tab-pane key="balance" tab="余额流水">
        <a-table
          :columns="balanceColumns"
          :data-source="balances"
          :loading="balanceLoading"
          :pagination="{ current: balancePage, total: balanceTotal, pageSize: 20, showTotal: t => `共 ${t} 条` }"
          row-key="id"
          @change="(p) => fetchBalances(p.current)"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>
