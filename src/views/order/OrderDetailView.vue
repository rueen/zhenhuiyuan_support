<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getOrder, updateShipments, cancelOrder, refundOrder, getLogisticsCompanies, getShipmentTrack, updateOrderReceiver } from '@/api/order'
import { buildRegionOptions } from '@/utils/regions'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = route.params.id
const loading = ref(false)
const order = ref(null)

const STATUS_MAP = {
  0: ['待付款', 'default'],
  1: ['待发货', 'processing'],
  2: ['已发货', 'warning'],
  4: ['已取消', 'error'],
  5: ['已退款', 'magenta'],
}

const itemColumns = [
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
  { title: '单价', dataIndex: 'price' },
  { title: '数量', dataIndex: 'quantity' },
  { title: '小计', dataIndex: 'subtotal' },
]

const shipmentColumns = [
  { title: '物流公司', dataIndex: 'logistics_company' },
  { title: '运单号', dataIndex: 'tracking_no' },
  { title: '发货时间', dataIndex: 'created_at' },
  { title: '操作', key: 'action' },
]

async function fetchOrder() {
  loading.value = true
  try { order.value = await getOrder(id) } finally { loading.value = false }
}
onMounted(fetchOrder)

// 物流公司列表
const logisticsCompanies = ref([])
async function fetchLogisticsCompanies() {
  try { logisticsCompanies.value = await getLogisticsCompanies() } catch {}
}
onMounted(fetchLogisticsCompanies)

// 发货 / 修改物流（多包裹）
const shipOpen = ref(false)
const shipPackages = ref([{ logistics_company: '', logistics_code: '', tracking_no: '' }])
const shipLoading = ref(false)

function openShipModal() {
  const shipments = order.value?.shipments
  if (order.value?.status === 2 && shipments?.length) {
    // 修改物流：回填已有包裹信息，保留 id 供后端 diff，logistics_code 通过名称反查
    shipPackages.value = shipments.map(s => {
      const matched = logisticsCompanies.value.find(c => c.name === s.logistics_company)
      return {
        id: s.id,
        logistics_company: s.logistics_company,
        logistics_code: matched?.code ?? '',
        tracking_no: s.tracking_no,
      }
    })
  } else {
    shipPackages.value = [{ logistics_company: '', logistics_code: '', tracking_no: '' }]
  }
  shipOpen.value = true
}

function addPackage() {
  shipPackages.value.push({ logistics_company: '', logistics_code: '', tracking_no: '' })
}

function removePackage(index) {
  shipPackages.value.splice(index, 1)
}

function onCompanyChange(index, code) {
  const company = logisticsCompanies.value.find(c => c.code === code)
  if (company) {
    shipPackages.value[index].logistics_company = company.name
    shipPackages.value[index].logistics_code = company.code
  }
}

async function submitShip() {
  for (const pkg of shipPackages.value) {
    if (!pkg.logistics_code || !pkg.tracking_no) return message.warning('请填写所有包裹的物流信息')
  }
  shipLoading.value = true
  try {
    const shipments = shipPackages.value.map(pkg => {
      const item = {
        logistics_company: pkg.logistics_company,
        logistics_code: pkg.logistics_code,
        tracking_no: pkg.tracking_no,
      }
      if (pkg.id) item.id = pkg.id
      return item
    })
    await updateShipments(id, shipments)
    message.success(order.value?.status === 1 ? '发货成功' : '物流信息已更新')
    shipOpen.value = false
    fetchOrder()
  } finally { shipLoading.value = false }
}

// 取消
function handleCancel() {
  Modal.confirm({ title: '确定取消该订单？', onOk: async () => { await cancelOrder(id); message.success('已取消'); fetchOrder() } })
}

// 退款（全额，仅待发货/已发货）
const refundOpen = ref(false)
const refundLoading = ref(false)
const refundReason = ref('')

function openRefundModal() {
  refundReason.value = ''
  refundOpen.value = true
}

async function submitRefund() {
  refundLoading.value = true
  try {
    await refundOrder(id, { reason: refundReason.value.trim() || undefined })
    message.success('退款成功')
    refundOpen.value = false
    fetchOrder()
  } finally { refundLoading.value = false }
}

// 修改收货信息
const receiverOpen = ref(false)
const receiverLoading = ref(false)
const regionOptions = buildRegionOptions()
const receiverForm = ref({
  receiver_name: '',
  phone: '',
  region: [],
  province_code: '',
  province_name: '',
  city_code: '',
  city_name: '',
  district_code: '',
  district_name: '',
  detail: '',
})

/**
 * 级联选择变化时，将选中的 code/name 同步到 form 字段
 * @param {string[]} codes - [province_code, city_code, district_code]
 * @param {object[]} selectedOptions - 对应的选项对象数组
 */
function onRegionChange(codes, selectedOptions) {
  receiverForm.value.province_code = codes[0] ?? ''
  receiverForm.value.province_name = selectedOptions[0]?.label ?? ''
  receiverForm.value.city_code = codes[1] ?? ''
  receiverForm.value.city_name = selectedOptions[1]?.label ?? ''
  receiverForm.value.district_code = codes[2] ?? ''
  receiverForm.value.district_name = selectedOptions[2]?.label ?? ''
}

/** 打开修改收货信息弹窗，回填当前快照 */
function openReceiverModal() {
  const s = order.value?.receiver_snapshot ?? {}
  const region = [s.province_code, s.city_code, s.district_code].filter(Boolean)
  receiverForm.value = {
    receiver_name: s.receiver_name ?? '',
    phone: s.phone ?? '',
    region,
    province_code: s.province_code ?? '',
    province_name: s.province_name ?? '',
    city_code: s.city_code ?? '',
    city_name: s.city_name ?? '',
    district_code: s.district_code ?? '',
    district_name: s.district_name ?? '',
    detail: s.detail ?? '',
  }
  receiverOpen.value = true
}

async function submitReceiver() {
  const f = receiverForm.value
  if (!f.receiver_name || !f.phone || !f.detail) {
    return message.warning('收货人、手机号、详细地址为必填项')
  }
  receiverLoading.value = true
  try {
    const { region: _, ...payload } = f
    await updateOrderReceiver(id, payload)
    message.success('收货信息已更新')
    receiverOpen.value = false
    fetchOrder()
  } finally {
    receiverLoading.value = false
  }
}

// 物流轨迹
const trackOpen = ref(false)
const trackLoading = ref(false)
const trackData = ref(null)

async function viewTrack(shipment) {
  trackOpen.value = true
  trackLoading.value = true
  trackData.value = null
  try {
    trackData.value = await getShipmentTrack(id, shipment.id)
  } catch {
    message.error('查询物流轨迹失败')
  } finally {
    trackLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- 顶部操作栏 -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <a-button @click="router.back()">← 返回</a-button>
      <a-space v-if="order">
        <a-button v-if="order.status === 1" type="primary" @click="openShipModal">发货</a-button>
        <a-button
          v-if="[1, 2].includes(order.status) && auth.hasPermission('order:refund')"
          danger
          @click="openRefundModal"
        >退款</a-button>
        <a-button v-if="[0, 1].includes(order.status)" danger @click="handleCancel">取消订单</a-button>
      </a-space>
    </div>
    <a-spin :spinning="loading">
      <template v-if="order">
        <a-descriptions title="基本信息" bordered :column="2" style="margin-bottom:24px">
          <a-descriptions-item label="订单号">{{ order.order_no }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="STATUS_MAP[order.status]?.[1]">{{ STATUS_MAP[order.status]?.[0] }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="下单会员">
            <a-button
              type="link"
              size="small"
              style="padding:0"
              @click="router.push(`/members/${order.member_id}`)"
            >{{ order.member_nickname || order.member_id }}</a-button>
          </a-descriptions-item>
          <a-descriptions-item label="商品金额">{{ order.product_amount }}</a-descriptions-item>
          <a-descriptions-item label="运费">{{ order.shipping_fee }}</a-descriptions-item>
          <a-descriptions-item label="实付">{{ order.pay_amount }}</a-descriptions-item>
          <a-descriptions-item label="下单时间">{{ order.created_at }}</a-descriptions-item>
          <a-descriptions-item label="支付时间">{{ order.paid_at || '—' }}</a-descriptions-item>
        </a-descriptions>

        <a-descriptions
          v-if="order.status === 5"
          title="退款信息"
          bordered
          :column="2"
          style="margin-bottom:24px"
        >
          <a-descriptions-item label="退款金额">{{ order.refund_amount }}</a-descriptions-item>
          <a-descriptions-item label="退款时间">{{ order.refunded_at || '—' }}</a-descriptions-item>
          <a-descriptions-item label="操作人">{{ order.refund_admin_id || '—' }}</a-descriptions-item>
          <a-descriptions-item label="退款原因">{{ order.refund_reason || '—' }}</a-descriptions-item>
        </a-descriptions>

        <a-descriptions :column="1" style="margin-bottom:24px" v-if="order.receiver_snapshot">
          <template #title>
            <span>收货信息</span>
            <a-button
              v-if="[0, 1, 2].includes(order.status)"
              type="link"
              size="small"
              style="margin-left:8px;padding:0"
              @click="openReceiverModal"
            >修改</a-button>
          </template>
          <a-descriptions-item label="收货人">{{ order.receiver_snapshot.receiver_name }}</a-descriptions-item>
          <a-descriptions-item label="手机">{{ order.receiver_snapshot.phone }}</a-descriptions-item>
          <a-descriptions-item label="地址" :span="2">
            <a-space>
              <span>{{ order.receiver_snapshot.province_name }}</span>
              <span>{{ order.receiver_snapshot.city_name }}</span>
              <span>{{ order.receiver_snapshot.district_name }}</span>
              <span>{{ order.receiver_snapshot.detail }}</span>
            </a-space>
          </a-descriptions-item>
        </a-descriptions>

        <a-card title="商品明细" :bordered="false" size="small" style="margin-bottom:16px">
          <a-table :columns="itemColumns" :data-source="order.items" row-key="id" :pagination="false" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'product_name'">
                <a-button
                  type="link"
                  size="small"
                  style="padding:0"
                  @click="router.push(`/products/${record.product_id}/edit`)"
                >{{ record.product_name }}</a-button>
              </template>
            </template>
          </a-table>
        </a-card>

        <a-card :bordered="false" size="small" style="margin-bottom:16px">
          <template #title>
            <span>物流包裹</span>
            <a-button
              v-if="order.status === 2"
              type="link"
              size="small"
              style="margin-left:8px;padding:0"
              @click="openShipModal"
            >修改</a-button>
          </template>
          <a-table :columns="shipmentColumns" :data-source="order.shipments" row-key="id" :pagination="false" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="viewTrack(record)">查看轨迹</a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </template>
    </a-spin>

    <!-- 发货 / 修改物流弹窗（多包裹） -->
    <a-modal
      v-model:open="shipOpen"
      :title="order?.status === 1 ? '填写物流信息' : '修改物流信息'"
      :confirm-loading="shipLoading"
      width="600px"
      @ok="submitShip"
    >
      <div v-for="(pkg, index) in shipPackages" :key="index" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-weight:500">包裹 {{ index + 1 }}</span>
          <a-button type="link" danger size="small" @click="removePackage(index)">删除</a-button>
        </div>
        <a-form layout="vertical">
          <a-form-item label="物流公司" required>
            <a-select
              v-model:value="pkg.logistics_code"
              placeholder="请选择物流公司"
              @change="(code) => onCompanyChange(index, code)"
            >
              <a-select-option v-for="c in logisticsCompanies" :key="c.code" :value="c.code">{{ c.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="运单号" required>
            <a-input v-model:value="pkg.tracking_no" placeholder="请输入运单号" />
          </a-form-item>
        </a-form>
        <a-divider v-if="index < shipPackages.length - 1" style="margin:8px 0" />
      </div>
      <a-button type="dashed" block @click="addPackage">+ 添加包裹</a-button>
    </a-modal>

    <!-- 修改收货信息弹窗 -->
    <a-modal
      v-model:open="receiverOpen"
      title="修改收货信息"
      :confirm-loading="receiverLoading"
      width="520px"
      @ok="submitReceiver"
    >
      <a-form layout="vertical" style="margin-top:8px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="收货人" required>
              <a-input v-model:value="receiverForm.receiver_name" placeholder="请输入收货人姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号" required>
              <a-input v-model:value="receiverForm.phone" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="省 / 市 / 区县">
          <a-cascader
            v-model:value="receiverForm.region"
            :options="regionOptions"
            placeholder="请选择省市区"
            style="width:100%"
            show-search
            @change="onRegionChange"
          />
        </a-form-item>
        <a-form-item label="详细地址" required>
          <a-input v-model:value="receiverForm.detail" placeholder="请输入详细地址" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 退款弹窗 -->
    <a-modal
      v-model:open="refundOpen"
      title="订单退款"
      :confirm-loading="refundLoading"
      width="480px"
      @ok="submitRefund"
    >
      <a-alert
        message="将对该订单发起全额退款，已发放的贡献值、余额返利、销量将一并回退，且不可撤销。"
        type="warning"
        show-icon
        style="margin-bottom:16px"
      />
      <a-form layout="vertical">
        <a-form-item label="退款原因（可选）">
          <a-textarea
            v-model:value="refundReason"
            :rows="3"
            :maxlength="255"
            show-count
            placeholder="请输入退款原因"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 物流轨迹弹窗 -->
    <a-modal v-model:open="trackOpen" title="物流轨迹" :footer="null" width="520px">
      <a-spin :spinning="trackLoading">
        <template v-if="trackData">
          <a-descriptions :column="1" size="small" style="margin-bottom:16px">
            <a-descriptions-item label="物流公司">{{ trackData.logistics_company }}</a-descriptions-item>
            <a-descriptions-item label="运单号">{{ trackData.tracking_no }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ trackData.state_text }}</a-descriptions-item>
          </a-descriptions>
          <a-timeline v-if="trackData.tracks?.length">
            <a-timeline-item v-for="(item, i) in trackData.tracks" :key="i">
              <div>{{ item.context }}</div>
              <div style="color:#999;font-size:12px">{{ item.time }}</div>
            </a-timeline-item>
          </a-timeline>
          <a-empty v-else description="暂无轨迹信息" />
        </template>
      </a-spin>
    </a-modal>
  </div>
</template>
