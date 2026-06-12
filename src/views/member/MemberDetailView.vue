<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import CopyButton from '@/components/CopyButton.vue'
import {
  getMember,
  getMembers,
  getMemberContributionLogs,
  getMemberBalanceLogs,
  getMemberHealthRecords,
  updateMember,
  updateMemberParent,
  updateMemberLevel,
  updateMemberDevice,
  adjustMemberContribution,
  adjustMemberBalance,
} from '@/api/member'
import { getLevels } from '@/api/level'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = route.params.id

const info = ref(null)
const infoLoading = ref(false)

/** 等级选项（编辑/调整等级共用） */
const levelOptions = ref([])

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
  { title: '变动值', dataIndex: 'change_amount' },
  { title: '当前总贡献值', dataIndex: 'balance_after' },
  { title: '来源订单', dataIndex: 'related_order_no', key: 'related_order' },
  { title: '类型', dataIndex: 'type_text' },
  { title: '说明', dataIndex: 'remark' },
  { title: '时间', dataIndex: 'created_at', width: 160 },
]

const balanceColumns = [
  { title: '变动金额', dataIndex: 'change_amount' },
  { title: '当前余额', dataIndex: 'balance_after' },
  { title: '类型', dataIndex: 'type', key: 'balance_type' },
  { title: '来源', dataIndex: 'source' },
  { title: '说明', dataIndex: 'remark' },
  { title: '时间', dataIndex: 'created_at', width: 160 },
]

/** 余额流水类型中文映射（未知类型回退原值） */
const BALANCE_TYPE_TEXT = {
  refund_clawback: '退款回退',
  admin_adjust: '手动调整',
}

const patientColumns = [
  { title: '就诊人', dataIndex: 'patname' },
  { title: '性别', dataIndex: 'sex' },
  { title: '年龄', dataIndex: 'age' },
  { title: '就诊时间', dataIndex: 'visitdate' },
  { title: '操作', key: 'action' },
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

async function fetchLevels() {
  const res = await getLevels()
  levelOptions.value = res
}

onMounted(() => { fetchInfo(); fetchContribs(); fetchBalances(); fetchLevels() })

// ---- 编辑会员（昵称/手机/状态） ----
const editOpen = ref(false)
const editForm = reactive({ nickname: '', phone: '', status: 1 })

function openEdit() {
  editForm.nickname = info.value.nickname
  editForm.phone = info.value.phone
  editForm.status = info.value.status
  editOpen.value = true
}

const editLoading = ref(false)
async function submitEdit() {
  editLoading.value = true
  try {
    await updateMember(id, { nickname: editForm.nickname, phone: editForm.phone, status: editForm.status })
    message.success('修改成功')
    editOpen.value = false
    fetchInfo()
  } finally {
    editLoading.value = false
  }
}

// ---- 变更上级 ----
const parentOpen = ref(false)
const parentForm = reactive({ parentId: null })

/** 上级搜索下拉选项 */
const parentOptions = ref([])
const parentSearchLoading = ref(false)
/** 防抖定时器 */
let parentSearchTimer = null

/**
 * 远程搜索可选上级（防抖 300ms）
 * @param {string} keyword - 昵称或手机号关键词
 */
async function searchParentOptions(keyword) {
  clearTimeout(parentSearchTimer)
  if (!keyword?.trim()) {
    parentOptions.value = []
    return
  }
  parentSearchTimer = setTimeout(async () => {
    parentSearchLoading.value = true
    try {
      const res = await getMembers({ keyword: keyword.trim(), pageSize: 20 })
      // 过滤自身，避免选自己为上级
      parentOptions.value = res.list.filter(m => String(m.id) !== String(id))
    } finally {
      parentSearchLoading.value = false
    }
  }, 300)
}

/**
 * 打开变更上级弹窗，若已有上级则预加载其信息
 */
async function openParent() {
  parentForm.parentId = info.value.parent_id || null
  parentOptions.value = []
  parentOpen.value = true
  if (info.value.parent_id) {
    try {
      const m = await getMember(info.value.parent_id)
      parentOptions.value = [m]
    } catch (_) { /* 加载失败不阻塞弹窗 */ }
  }
}

const parentLoading = ref(false)
async function submitParent() {
  parentLoading.value = true
  try {
    await updateMemberParent(id, { parent_id: parentForm.parentId || null })
    message.success('变更成功')
    parentOpen.value = false
    fetchInfo()
  } finally {
    parentLoading.value = false
  }
}

// ---- 调整等级 ----
const levelOpen = ref(false)
const levelForm = reactive({ levelId: undefined })

function openLevel() {
  levelForm.levelId = info.value.level_id
  levelOpen.value = true
}

const levelLoading = ref(false)
async function submitLevel() {
  levelLoading.value = true
  try {
    await updateMemberLevel(id, { level_id: levelForm.levelId })
    message.success('调整成功（已设为等级地板）')
    levelOpen.value = false
    fetchInfo()
  } finally {
    levelLoading.value = false
  }
}

// ---- 调整贡献值 / 余额 ----
const adjustOpen = ref(false)
const adjustType = ref('contribution') // 'contribution' | 'balance'
const adjustForm = reactive({ amount: null, remark: '' })
const adjustLoading = ref(false)

const adjustTitle = computed(() =>
  adjustType.value === 'contribution' ? '调整贡献值' : '调整可提现余额',
)

function openAdjust(type) {
  adjustType.value = type
  adjustForm.amount = null
  adjustForm.remark = ''
  adjustOpen.value = true
}

async function submitAdjust() {
  const amount = Number(adjustForm.amount)
  if (!amount || Number.isNaN(amount)) return message.warning('请输入非 0 的调整金额')
  if (!adjustForm.remark.trim()) return message.warning('请填写备注')
  adjustLoading.value = true
  try {
    const payload = { amount, remark: adjustForm.remark.trim() }
    if (adjustType.value === 'contribution') await adjustMemberContribution(id, payload)
    else await adjustMemberBalance(id, payload)
    message.success('调整成功')
    adjustOpen.value = false
    fetchInfo()
    adjustType.value === 'contribution' ? fetchContribs(contribPage.value) : fetchBalances(balancePage.value)
  } finally {
    adjustLoading.value = false
  }
}

// ---- AI 体检设备绑定 ----
const deviceOpen = ref(false)
const deviceForm = reactive({ hardware_enabled: false, mac_address: '' })

/** 打开 AI 体检弹窗，回填当前设置 */
function openDevice() {
  deviceForm.hardware_enabled = info.value.hardware_enabled === 1
  deviceForm.mac_address = info.value.mac_address || ''
  deviceOpen.value = true
}

const deviceLoading = ref(false)
async function submitDevice() {
  if (deviceForm.hardware_enabled && !deviceForm.mac_address.trim()) {
    message.warning('开通 AI 体检时 macAddress 为必填项')
    return
  }
  deviceLoading.value = true
  try {
    await updateMemberDevice(id, {
      hardware_enabled: deviceForm.hardware_enabled ? 1 : 0,
      mac_address: deviceForm.mac_address.trim() || null,
    })
    message.success('设置成功')
    deviceOpen.value = false
    await fetchInfo()
    if (info.value.hardware_enabled === 1) fetchPatientList()
  } finally {
    deviceLoading.value = false
  }
}

// ---- 体检记录 ----

/** 是否显示体检记录 Tab */
const hasDevice = computed(() => info.value?.hardware_enabled === 1)

const patients = ref([])
const patientLoading = ref(false)

/** 通过后端接口获取会员体检记录 */
async function fetchPatientList() {
  patientLoading.value = true
  try {
    const res = await getMemberHealthRecords(id)
    // 兼容接口返回纯数组或 { list: [] } 两种结构
    patients.value = Array.isArray(res) ? res : (res?.list ?? [])
  } catch (e) {
    message.error('获取体检记录失败：' + e.message)
  } finally {
    patientLoading.value = false
  }
}

/**
 * 点击查看报告，新窗口打开体检报告链接
 * @param {string} patno - 就诊编号
 */
function viewReport(patno) {
  window.open(
    `https://iot.smfyunpingtai.com/jiayishen/#/pages/pulseReport/pulseReport?patno=${patno}`,
    '_blank',
  )
}

// 开通状态变化后自动拉取/清空体检记录
watch(hasDevice, (val) => {
  if (val) fetchPatientList()
  else patients.value = []
})
</script>

<template>
  <div>
    <!-- 顶部操作栏 -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <a-button @click="router.back()">← 返回</a-button>
      <a-space v-if="info">
        <a-button @click="openEdit">编辑</a-button>
        <a-button @click="openParent">变更上级</a-button>
        <a-button @click="openLevel">调整等级</a-button>
        <a-button v-if="auth.hasPermission('member:adjust')" @click="openAdjust('contribution')">调整贡献值</a-button>
        <a-button v-if="auth.hasPermission('member:adjust')" @click="openAdjust('balance')">调整余额</a-button>
        <a-button @click="openDevice">AI体检</a-button>
      </a-space>
    </div>

    <a-skeleton :loading="infoLoading" active>
      <template v-if="info">
        <a-descriptions title="基本信息" bordered :column="2" style="margin-bottom:24px">
          <a-descriptions-item label="ID">{{ info.id }}</a-descriptions-item>
          <a-descriptions-item label="昵称">{{ info.nickname }}</a-descriptions-item>
          <a-descriptions-item label="手机号">{{ info.phone }}</a-descriptions-item>
          <a-descriptions-item label="等级">
            {{ info.level_name }}
            <a-tag v-if="info.level_floor_id" color="orange" style="margin-left:8px">已设等级地板</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="累计贡献值">{{ info.cumulative_contribution }}</a-descriptions-item>
          <a-descriptions-item label="可提现余额">{{ info.withdrawable_balance }}</a-descriptions-item>
          <a-descriptions-item label="邀请码">
            <a-space>
              <span>{{ info.invite_code }}</span>
              <CopyButton :text="info.invite_code" />
            </a-space>
          </a-descriptions-item>
          <a-descriptions-item label="上级ID">{{ info.parent_id || '—' }}</a-descriptions-item>
          <a-descriptions-item label="首次消费时间">{{ info.first_consumed_at || '未消费' }}</a-descriptions-item>
          <a-descriptions-item label="注册时间">{{ info.created_at }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="info.status === 1 ? 'success' : 'default'">{{ info.status === 1 ? '正常' : '禁用' }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="AI体检">
            <a-tag :color="info.hardware_enabled === 1 ? 'processing' : 'default'">
              {{ info.hardware_enabled === 1 ? '已开通' : '未开通' }}
            </a-tag>
            <span v-if="info.mac_address" style="margin-left:8px;color:rgba(0,0,0,.45);font-size:12px">
              {{ info.mac_address }}
            </span>
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
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'related_order'">
              <a-button
                v-if="record.related_order_id"
                type="link"
                size="small"
                style="padding:0"
                @click="router.push(`/orders/${record.related_order_id}`)"
              >{{ record.related_order_no }}</a-button>
              <span v-else>—</span>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="balance" tab="余额流水">
        <a-table
          :columns="balanceColumns"
          :data-source="balances"
          :loading="balanceLoading"
          :pagination="{ current: balancePage, total: balanceTotal, pageSize: 20, showTotal: t => `共 ${t} 条` }"
          row-key="id"
          @change="(p) => fetchBalances(p.current)"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'balance_type'">
              {{ BALANCE_TYPE_TEXT[record.type] || record.type }}
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <!-- 仅开通 AI 体检后显示 -->
      <a-tab-pane v-if="hasDevice" key="patient" tab="体检记录">
        <a-table
          :columns="patientColumns"
          :data-source="patients"
          :loading="patientLoading"
          row-key="patno"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="viewReport(record.patno)">查看报告</a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <!-- 编辑弹窗 -->
    <a-modal v-model:open="editOpen" title="编辑会员" :confirm-loading="editLoading" @ok="submitEdit">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="昵称">
          <a-input v-model:value="editForm.nickname" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="editForm.phone" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model:value="editForm.status">
            <a-radio :value="1">正常</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 变更上级 -->
    <a-modal v-model:open="parentOpen" title="变更上级" :confirm-loading="parentLoading" @ok="submitParent">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="新上级（留空则移除上级）">
          <a-select
            v-model:value="parentForm.parentId"
            show-search
            allow-clear
            :filter-option="false"
            :loading="parentSearchLoading"
            placeholder="输入昵称或手机号搜索"
            style="width:100%"
            :not-found-content="parentSearchLoading ? '搜索中…' : '暂无匹配会员'"
            @search="searchParentOptions"
          >
            <a-select-option v-for="m in parentOptions" :key="m.id" :value="m.id">
              {{ m.nickname }}
              <span style="color:rgba(0,0,0,.45);font-size:12px;margin-left:6px">{{ m.phone }}</span>
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 调整等级 -->
    <a-modal v-model:open="levelOpen" title="调整等级（设为等级地板）" :confirm-loading="levelLoading" @ok="submitLevel">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="目标等级">
          <a-select v-model:value="levelForm.levelId" style="width:100%">
            <a-select-option v-for="lv in levelOptions" :key="lv.id" :value="lv.id">{{ lv.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-alert message="手动调整后该等级成为「地板」：系统仍会自动升级，自动降级时不会跌破此等级" type="warning" show-icon style="margin-top:8px" />
      </a-form>
    </a-modal>

    <!-- 调整贡献值 / 余额 -->
    <a-modal v-model:open="adjustOpen" :title="adjustTitle" :confirm-loading="adjustLoading" @ok="submitAdjust">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="调整金额（正数增加，负数减少，不能为 0）" required>
          <a-input-number
            v-model:value="adjustForm.amount"
            style="width:100%"
            placeholder="请输入调整金额"
          />
        </a-form-item>
        <a-form-item label="备注" required>
          <a-textarea v-model:value="adjustForm.remark" :rows="3" :maxlength="255" show-count placeholder="请输入备注" />
        </a-form-item>
        <a-alert
          v-if="adjustType === 'balance'"
          message="余额允许调整为负数（记为欠款，后续新返利将自动抵扣）"
          type="info"
          show-icon
        />
        <a-alert
          v-else
          message="调整贡献值会触发等级自动重算（受等级地板约束）"
          type="info"
          show-icon
        />
      </a-form>
    </a-modal>

    <!-- AI 体检设备绑定 -->
    <a-modal v-model:open="deviceOpen" title="AI体检设置" :confirm-loading="deviceLoading" @ok="submitDevice">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="开通功能">
          <a-switch v-model:checked="deviceForm.hardware_enabled" checked-children="开" un-checked-children="关" />
        </a-form-item>
        <a-form-item label="设备码 macAddress" :required="deviceForm.hardware_enabled">
          <a-input
            v-model:value="deviceForm.mac_address"
            placeholder="请输入设备 MAC 地址"
            :disabled="!deviceForm.hardware_enabled"
            allow-clear
          />
          <div v-if="deviceForm.hardware_enabled" style="color:rgba(0,0,0,.45);font-size:12px;margin-top:4px">
            开通功能时 macAddress 为必填项
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
