<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getMembers, updateMember, updateMemberParent, updateMemberLevel } from '@/api/member'
import { getLevels } from '@/api/level'

const router = useRouter()

// 列表数据
const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })

// 筛选
const filters = reactive({ keyword: '', levelId: undefined, status: undefined })

// 等级选项
const levelOptions = ref([])

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '昵称', dataIndex: 'nickname' },
  { title: '手机号', dataIndex: 'phone' },
  { title: '等级', dataIndex: 'level_name' },
  { title: '贡献值', dataIndex: 'cumulative_contribution', width: 100 },
  { title: '可提余额', dataIndex: 'withdrawable_balance', width: 110 },
  { title: '邀请码', dataIndex: 'invite_code', width: 110 },
  { title: '上级ID', dataIndex: 'parent_id', width: 90 },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '注册时间', dataIndex: 'created_at', width: 160 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getMembers({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      levelId: filters.levelId,
      status: filters.status,
    })
    dataSource.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function fetchLevels() {
  const res = await getLevels()
  levelOptions.value = res
}

onMounted(() => { fetchList(); fetchLevels() })

function onTableChange(pag) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchList()
}

function search() { pagination.current = 1; fetchList() }
function reset() { filters.keyword = ''; filters.levelId = undefined; filters.status = undefined; search() }

// 编辑会员（昵称/手机/状态）
const editOpen = ref(false)
const editForm = reactive({ id: null, nickname: '', phone: '', status: 1 })

function openEdit(record) {
  editForm.id = record.id
  editForm.nickname = record.nickname
  editForm.phone = record.phone
  editForm.status = record.status
  editOpen.value = true
}

const editLoading = ref(false)
async function submitEdit() {
  editLoading.value = true
  try {
    await updateMember(editForm.id, { nickname: editForm.nickname, phone: editForm.phone, status: editForm.status })
    message.success('修改成功')
    editOpen.value = false
    fetchList()
  } finally {
    editLoading.value = false
  }
}

// 变更上级
const parentOpen = ref(false)
const parentForm = reactive({ id: null, parentId: '' })

function openParent(record) {
  parentForm.id = record.id
  parentForm.parentId = record.parent_id ? String(record.parent_id) : ''
  parentOpen.value = true
}

const parentLoading = ref(false)
async function submitParent() {
  parentLoading.value = true
  try {
    await updateMemberParent(parentForm.id, { parent_id: parentForm.parentId ? Number(parentForm.parentId) : null })
    message.success('变更成功')
    parentOpen.value = false
    fetchList()
  } finally {
    parentLoading.value = false
  }
}

// 调整等级
const levelOpen = ref(false)
const levelForm = reactive({ id: null, levelId: undefined })

function openLevel(record) {
  levelForm.id = record.id
  levelForm.levelId = record.level_id
  levelOpen.value = true
}

const levelLoading = ref(false)
async function submitLevel() {
  levelLoading.value = true
  try {
    await updateMemberLevel(levelForm.id, { level_id: levelForm.levelId })
    message.success('调整成功（已锁定等级）')
    levelOpen.value = false
    fetchList()
  } finally {
    levelLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="filter-bar">
      <a-input v-model:value="filters.keyword" placeholder="昵称 / 手机 / 邀请码" style="width:220px" allow-clear />
      <a-select v-model:value="filters.levelId" placeholder="等级" style="width:130px" allow-clear>
        <a-select-option v-for="lv in levelOptions" :key="lv.id" :value="lv.id">{{ lv.name }}</a-select-option>
      </a-select>
      <a-select v-model:value="filters.status" placeholder="状态" style="width:100px" allow-clear>
        <a-select-option :value="1">正常</a-select-option>
        <a-select-option :value="0">禁用</a-select-option>
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
      scroll="{ x: 1200 }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 1 ? 'success' : 'default'">
            {{ record.status === 1 ? '正常' : '禁用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="router.push(`/members/${record.id}`)">详情</a-button>
            <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button type="link" size="small" @click="openParent(record)">变更上级</a-button>
            <a-button type="link" size="small" @click="openLevel(record)">调整等级</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

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
        <a-form-item label="新上级ID（留空则移除上级）">
          <a-input v-model:value="parentForm.parentId" placeholder="请输入上级会员ID" allow-clear />
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
