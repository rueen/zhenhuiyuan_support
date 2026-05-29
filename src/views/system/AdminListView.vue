<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getAdmins, createAdmin, updateAdmin, updateAdminStatus, resetAdminPassword, deleteAdmin } from '@/api/admin'
import { getRoles } from '@/api/role'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const loading = ref(false)
const dataSource = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 20 })
const filters = reactive({ keyword: '' })
const roleOptions = ref([])

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username' },
  { title: '真实姓名', dataIndex: 'real_name' },
  { title: '角色', dataIndex: 'role_name', width: 130 },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '创建时间', dataIndex: 'created_at', width: 160 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getAdmins({ page: pagination.current, pageSize: pagination.pageSize, keyword: filters.keyword || undefined })
    dataSource.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}
async function fetchRoles() { roleOptions.value = await getRoles() }
onMounted(() => { fetchList(); fetchRoles() })

function onTableChange(pag) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchList() }
function search() { pagination.current = 1; fetchList() }
function reset() { filters.keyword = ''; search() }

// 新增
const addOpen = ref(false)
const addLoading = ref(false)
const addForm = reactive({ username: '', password: '', real_name: '', role_id: undefined })

async function submitAdd() {
  if (!addForm.username || !addForm.password) return message.warning('用户名和密码必填')
  addLoading.value = true
  try {
    await createAdmin({ ...addForm })
    message.success('新增成功')
    addOpen.value = false
    Object.assign(addForm, { username: '', password: '', real_name: '', role_id: undefined })
    fetchList()
  } finally { addLoading.value = false }
}

// 编辑
const editOpen = ref(false)
const editLoading = ref(false)
const editForm = reactive({ id: null, real_name: '', role_id: undefined })

function openEdit(r) { editForm.id = r.id; editForm.real_name = r.real_name || ''; editForm.role_id = r.role_id; editOpen.value = true }

async function submitEdit() {
  editLoading.value = true
  try {
    await updateAdmin(editForm.id, { real_name: editForm.real_name, role_id: editForm.role_id })
    message.success('修改成功')
    editOpen.value = false
    fetchList()
  } finally { editLoading.value = false }
}

// 启用/禁用
async function toggleStatus(record) {
  const newStatus = record.status === 1 ? 0 : 1
  try {
    await updateAdminStatus(record.id, { status: newStatus })
    message.success(newStatus === 1 ? '已启用' : '已禁用')
    fetchList()
  } catch {}
}

// 重置密码
const pwdOpen = ref(false)
const pwdLoading = ref(false)
const pwdForm = reactive({ id: null, password: '' })

function openPwd(r) { pwdForm.id = r.id; pwdForm.password = ''; pwdOpen.value = true }

async function submitPwd() {
  if (!pwdForm.password) return message.warning('请输入新密码')
  pwdLoading.value = true
  try {
    await resetAdminPassword(pwdForm.id, { password: pwdForm.password })
    message.success('密码已重置')
    pwdOpen.value = false
  } finally { pwdLoading.value = false }
}

// 删除
function handleDelete(record) {
  Modal.confirm({ title: `确定删除管理员「${record.username}」？`, onOk: async () => { await deleteAdmin(record.id); message.success('已删除'); fetchList() } })
}
</script>

<template>
  <div>
    <div class="action-bar">
      <div class="filter-bar" style="margin-bottom:0">
        <a-input v-model:value="filters.keyword" placeholder="用户名 / 真实姓名" style="width:220px" allow-clear />
        <a-button type="primary" @click="search">查询</a-button>
        <a-button @click="reset">重置</a-button>
      </div>
      <a-button type="primary" @click="addOpen = true">+ 新增管理员</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ current: pagination.current, pageSize: pagination.pageSize, total, showTotal: t => `共 ${t} 条` }"
      row-key="id"
      :scroll="{ x: 1000 }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 1 ? 'success' : 'default'">{{ record.status === 1 ? '启用' : '禁用' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button type="link" size="small" @click="openPwd(record)">重置密码</a-button>
            <a-button type="link" size="small" @click="toggleStatus(record)">
              {{ record.status === 1 ? '禁用' : '启用' }}
            </a-button>
            <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新增 -->
    <a-modal v-model:open="addOpen" title="新增管理员" :confirm-loading="addLoading" @ok="submitAdd">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="用户名" required><a-input v-model:value="addForm.username" /></a-form-item>
        <a-form-item label="初始密码" required><a-input-password v-model:value="addForm.password" /></a-form-item>
        <a-form-item label="真实姓名"><a-input v-model:value="addForm.real_name" /></a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="addForm.role_id" placeholder="请选择角色" allow-clear style="width:100%">
            <a-select-option v-for="r in roleOptions" :key="r.id" :value="r.id">{{ r.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑 -->
    <a-modal v-model:open="editOpen" title="编辑管理员" :confirm-loading="editLoading" @ok="submitEdit">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="真实姓名"><a-input v-model:value="editForm.real_name" /></a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="editForm.role_id" placeholder="请选择角色" allow-clear style="width:100%">
            <a-select-option v-for="r in roleOptions" :key="r.id" :value="r.id">{{ r.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 重置密码 -->
    <a-modal v-model:open="pwdOpen" title="重置密码" :confirm-loading="pwdLoading" @ok="submitPwd">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="pwdForm.password" placeholder="请输入新密码（6~32位）" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
