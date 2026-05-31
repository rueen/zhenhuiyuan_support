<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getWithdrawals, getWithdrawal, reviewWithdrawal, payWithdrawal } from '@/api/withdrawal'
import { getOssSignature } from '@/api/oss'

const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })
const filters = reactive({ keyword: '', status: undefined })

const STATUS_MAP = {
  0: ['待审核', 'processing'],
  1: ['待打款', 'warning'],
  2: ['已打款', 'success'],
  3: ['已驳回', 'error'],
}

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '会员ID', dataIndex: 'member_id', width: 90 },
  { title: '提现金额', dataIndex: 'amount', width: 110 },
  { title: '账户类型', key: 'account_type', width: 100 },
  { title: '账号（脱敏）', dataIndex: 'account_no_masked', width: 140 },
  { title: '真实姓名', dataIndex: 'real_name', width: 100 },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '申请时间', dataIndex: 'created_at', width: 160 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
]

const ACCOUNT_TYPE_MAP = { 1: '银行卡', 2: '支付宝', 3: '微信' }

async function fetchList() {
  loading.value = true
  try {
    const res = await getWithdrawals({
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

// 详情抽屉
const drawerOpen = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

async function openDetail(id) {
  drawerOpen.value = true
  detailLoading.value = true
  try { detail.value = await getWithdrawal(id) } finally { detailLoading.value = false }
}

// 审核弹窗
const reviewOpen = ref(false)
const reviewLoading = ref(false)
const reviewForm = reactive({ id: null, approve: true, reject_reason: '' })

function openReview(record) {
  reviewForm.id = record.id
  reviewForm.approve = true
  reviewForm.reject_reason = ''
  reviewOpen.value = true
}

async function submitReview() {
  if (!reviewForm.approve && !reviewForm.reject_reason) return message.warning('请填写驳回原因')
  reviewLoading.value = true
  try {
    await reviewWithdrawal(reviewForm.id, {
      approve: reviewForm.approve,
      reject_reason: reviewForm.approve ? undefined : reviewForm.reject_reason,
    })
    message.success(reviewForm.approve ? '已通过' : '已驳回')
    reviewOpen.value = false
    fetchList()
  } finally { reviewLoading.value = false }
}

// 打款弹窗
const payOpen = ref(false)
const payLoading = ref(false)
const payForm = reactive({ id: null, pay_voucher: '' })
const payFileList = ref([])

function openPay(record) {
  payForm.id = record.id
  payForm.pay_voucher = ''
  payFileList.value = []
  payOpen.value = true
}

// OSS 上传凭证图
async function customUpload({ file, onSuccess, onError }) {
  try {
    const sig = await getOssSignature('vouchers')
    const fd = new FormData()
    const key = `${sig.dir}${Date.now()}_${file.name}`
    fd.append('key', key)
    fd.append('OSSAccessKeyId', sig.accessKeyId)
    fd.append('policy', sig.policy)
    fd.append('signature', sig.signature)
    fd.append('success_action_status', '200')
    fd.append('file', file)
    await fetch(sig.host, { method: 'POST', body: fd })
    const url = `${sig.host}/${key}`
    payForm.pay_voucher = url
    onSuccess({ url }, file)
  } catch (e) { onError(e) }
}

async function submitPay() {
  if (!payForm.pay_voucher) return message.warning('请上传打款凭证')
  payLoading.value = true
  try {
    await payWithdrawal(payForm.id, { pay_voucher: payForm.pay_voucher })
    message.success('打款成功')
    payOpen.value = false
    fetchList()
  } finally { payLoading.value = false }
}
</script>

<template>
  <div>
    <div class="filter-bar">
      <a-input v-model:value="filters.keyword" placeholder="会员ID / 姓名" style="width:200px" allow-clear />
      <a-select v-model:value="filters.status" placeholder="状态" style="width:120px" allow-clear>
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
      :scroll="{ x: 1100 }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'account_type'">{{ ACCOUNT_TYPE_MAP[record.account_type] || '—' }}</template>
        <template v-else-if="column.dataIndex === 'status'">
          <a-tag :color="STATUS_MAP[record.status]?.[1]">{{ STATUS_MAP[record.status]?.[0] }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="openDetail(record.id)">详情</a-button>
            <a-button v-if="record.status === 0" type="link" size="small" @click="openReview(record)">审核</a-button>
            <a-button v-if="record.status === 1" type="link" size="small" @click="openPay(record)">打款</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 详情抽屉 -->
    <a-drawer v-model:open="drawerOpen" title="提现详情" width="480">
      <a-spin :spinning="detailLoading">
        <template v-if="detail">
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="ID">{{ detail.id }}</a-descriptions-item>
            <a-descriptions-item label="会员ID">{{ detail.member_id }}</a-descriptions-item>
            <a-descriptions-item label="真实姓名">{{ detail.real_name }}</a-descriptions-item>
            <a-descriptions-item label="账户类型">{{ ACCOUNT_TYPE_MAP[detail.account_type] }}</a-descriptions-item>
            <a-descriptions-item label="账号（脱敏）">{{ detail.account_no_masked }}</a-descriptions-item>
            <a-descriptions-item label="银行名称">{{ detail.bank_name || '—' }}</a-descriptions-item>
            <a-descriptions-item label="提现金额">{{ detail.amount }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="STATUS_MAP[detail.status]?.[1]">{{ STATUS_MAP[detail.status]?.[0] }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="驳回原因">{{ detail.reject_reason || '—' }}</a-descriptions-item>
            <a-descriptions-item label="打款凭证">
              <a-image v-if="detail.pay_voucher" :src="detail.pay_voucher" :width="100" />
              <span v-else>—</span>
            </a-descriptions-item>
            <a-descriptions-item label="申请时间">{{ detail.created_at }}</a-descriptions-item>
            <a-descriptions-item label="打款时间">{{ detail.paid_at || '—' }}</a-descriptions-item>
          </a-descriptions>
        </template>
      </a-spin>
    </a-drawer>

    <!-- 审核弹窗 -->
    <a-modal v-model:open="reviewOpen" title="提现审核" :confirm-loading="reviewLoading" @ok="submitReview">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="审核结果">
          <a-radio-group v-model:value="reviewForm.approve">
            <a-radio :value="true">通过 → 待打款</a-radio>
            <a-radio :value="false">驳回</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="!reviewForm.approve" label="驳回原因" required>
          <a-textarea v-model:value="reviewForm.reject_reason" :rows="3" placeholder="请填写驳回原因" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 打款弹窗 -->
    <a-modal v-model:open="payOpen" title="上传打款凭证" :confirm-loading="payLoading" @ok="submitPay">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="打款凭证图" required>
          <a-upload
            v-model:file-list="payFileList"
            list-type="picture-card"
            :max-count="1"
            :custom-request="customUpload"
          >
            <div v-if="payFileList.length < 1">
              <span>上传凭证</span>
            </div>
          </a-upload>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
