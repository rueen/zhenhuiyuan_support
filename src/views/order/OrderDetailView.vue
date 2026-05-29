<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getOrder, shipOrder, cancelOrder } from '@/api/order'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const loading = ref(false)
const order = ref(null)

const STATUS_MAP = {
  0: ['待付款', 'default'],
  1: ['待发货', 'processing'],
  2: ['待收货', 'warning'],
  3: ['已完成', 'success'],
  4: ['已取消', 'error'],
}

const itemColumns = [
  { title: '商品名称', dataIndex: 'product_name' },
  { title: '单价', dataIndex: 'price' },
  { title: '数量', dataIndex: 'quantity' },
  { title: '小计', dataIndex: 'subtotal' },
]

const shipmentColumns = [
  { title: '物流公司', dataIndex: 'logistics_company' },
  { title: '运单号', dataIndex: 'tracking_no' },
  { title: '发货时间', dataIndex: 'created_at' },
]

async function fetchOrder() {
  loading.value = true
  try { order.value = await getOrder(id) } finally { loading.value = false }
}
onMounted(fetchOrder)

// 发货
const shipOpen = ref(false)
const shipForm = ref({ logistics_company: '', tracking_no: '' })
const shipLoading = ref(false)

async function submitShip() {
  if (!shipForm.value.logistics_company || !shipForm.value.tracking_no) return message.warning('请填写物流信息')
  shipLoading.value = true
  try {
    await shipOrder(id, shipForm.value)
    message.success('发货成功')
    shipOpen.value = false
    fetchOrder()
  } finally { shipLoading.value = false }
}

// 取消
function handleCancel() {
  Modal.confirm({ title: '确定取消该订单？', onOk: async () => { await cancelOrder(id); message.success('已取消'); fetchOrder() } })
}
</script>

<template>
  <div>
    <a-page-header title="订单详情" @back="router.push('/orders')" style="padding:0 0 16px" />
    <a-spin :spinning="loading">
      <template v-if="order">
        <a-descriptions title="基本信息" bordered :column="2" style="margin-bottom:24px">
          <a-descriptions-item label="订单号">{{ order.order_no }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="STATUS_MAP[order.status]?.[1]">{{ STATUS_MAP[order.status]?.[0] }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="会员ID">{{ order.member_id }}</a-descriptions-item>
          <a-descriptions-item label="商品金额">{{ order.product_amount }}</a-descriptions-item>
          <a-descriptions-item label="运费">{{ order.shipping_fee }}</a-descriptions-item>
          <a-descriptions-item label="实付">{{ order.pay_amount }}</a-descriptions-item>
          <a-descriptions-item label="下单时间">{{ order.created_at }}</a-descriptions-item>
          <a-descriptions-item label="支付时间">{{ order.paid_at || '—' }}</a-descriptions-item>
        </a-descriptions>

        <a-descriptions title="收货信息" :column="2" style="margin-bottom:24px" v-if="order.receiver_snapshot">
          <a-descriptions-item label="收货人">{{ order.receiver_snapshot.receiver_name }}</a-descriptions-item>
          <a-descriptions-item label="手机">{{ order.receiver_snapshot.phone }}</a-descriptions-item>
          <a-descriptions-item label="地址" :span="2">{{ order.receiver_snapshot.detail }}</a-descriptions-item>
        </a-descriptions>

        <a-card title="商品明细" :bordered="false" size="small" style="margin-bottom:16px">
          <a-table :columns="itemColumns" :data-source="order.items" row-key="id" :pagination="false" size="small" />
        </a-card>

        <a-card title="物流包裹" :bordered="false" size="small" style="margin-bottom:16px">
          <a-table :columns="shipmentColumns" :data-source="order.shipments" row-key="id" :pagination="false" size="small" />
        </a-card>

        <a-space>
          <a-button v-if="order.status === 1" type="primary" @click="shipOpen = true">发货</a-button>
          <a-button v-if="[0, 1].includes(order.status)" danger @click="handleCancel">取消订单</a-button>
        </a-space>
      </template>
    </a-spin>

    <a-modal v-model:open="shipOpen" title="填写物流信息" :confirm-loading="shipLoading" @ok="submitShip">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="物流公司" required>
          <a-input v-model:value="shipForm.logistics_company" placeholder="如 顺丰速运" />
        </a-form-item>
        <a-form-item label="运单号" required>
          <a-input v-model:value="shipForm.tracking_no" placeholder="请输入运单号" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
