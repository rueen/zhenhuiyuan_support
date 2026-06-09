<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  getMember,
  getMembers,
  getMemberContributionLogs,
  getMemberBalanceLogs,
  updateMember,
  updateMemberParent,
  updateMemberLevel,
} from '@/api/member'
import { getLevels } from '@/api/level'

const route = useRoute()
const router = useRouter()
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
  // 预加载当前上级信息，保证选中项能正常显示
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
    message.success('调整成功（已锁定等级）')
    levelOpen.value = false
    fetchInfo()
  } finally {
    levelLoading.value = false
  }
}
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
      </a-space>
    </div>

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
    <a-modal v-model:open="levelOpen" title="调整等级（手动锁定）" :confirm-loading="levelLoading" @ok="submitLevel">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="目标等级">
          <a-select v-model:value="levelForm.levelId" style="width:100%">
            <a-select-option v-for="lv in levelOptions" :key="lv.id" :value="lv.id">{{ lv.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-alert message="手动调整后等级将被锁定，系统不再自动升/降级" type="warning" show-icon style="margin-top:8px" />
      </a-form>
    </a-modal>
  </div>
</template>
