<script setup>
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  getRoles, createRole, updateRole, deleteRole,
  updateRolePermissions, getPermissions
} from '@/api/role'

const loading = ref(false)
const data = ref([])

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '角色名称', dataIndex: 'name' },
  { title: '说明', dataIndex: 'description' },
  { title: '操作', key: 'action', width: 180 },
]

async function fetchData() {
  loading.value = true
  try { data.value = await getRoles() } finally { loading.value = false }
}
onMounted(fetchData)

// 新增/编辑角色
const modalOpen = ref(false)
const modalLoading = ref(false)
const editingId = ref(null)
const form = ref({ name: '', description: '' })

function openAdd() { editingId.value = null; form.value = { name: '', description: '' }; modalOpen.value = true }
function openEdit(r) { editingId.value = r.id; form.value = { name: r.name, description: r.description || '' }; modalOpen.value = true }

async function submitForm() {
  if (!form.value.name) return message.warning('请输入角色名称')
  modalLoading.value = true
  try {
    editingId.value ? await updateRole(editingId.value, form.value) : await createRole(form.value)
    message.success(editingId.value ? '修改成功' : '新增成功')
    modalOpen.value = false
    fetchData()
  } finally { modalLoading.value = false }
}

function handleDelete(id) {
  Modal.confirm({ title: '确定删除该角色？', onOk: async () => { await deleteRole(id); message.success('已删除'); fetchData() } })
}

// 分配权限
const permOpen = ref(false)
const permLoading = ref(false)
const permTreeData = ref([])
const checkedKeys = ref([])
const currentRoleId = ref(null)

// 将权限列表转为 a-tree 需要的格式
function buildTreeData(permissions) {
  return permissions.map(p => ({
    title: p.name,
    key: p.id,
    children: p.children?.map(c => ({ title: c.name, key: c.id })) || [],
  }))
}

// 从角色详情提取已勾选的权限ID（只取叶子节点key）
function getCheckedFromRole(role) {
  return role.permissions?.map(p => p.id) || []
}

async function openPerm(role) {
  currentRoleId.value = role.id
  permLoading.value = true
  permOpen.value = true
  try {
    const [perms, roleDetail] = await Promise.all([getPermissions(), getRoles().then(list => list.find(r => r.id === role.id))])
    permTreeData.value = buildTreeData(perms)
    checkedKeys.value = getCheckedFromRole(roleDetail)
  } finally { permLoading.value = false }
}

async function submitPerm() {
  permLoading.value = true
  try {
    await updateRolePermissions(currentRoleId.value, { permission_ids: checkedKeys.value })
    message.success('权限更新成功')
    permOpen.value = false
  } finally { permLoading.value = false }
}
</script>

<template>
  <div>
    <div class="action-bar">
      <span class="page-title">角色管理</span>
      <a-button type="primary" @click="openAdd">+ 新增角色</a-button>
    </div>
    <a-table :columns="columns" :data-source="data" :loading="loading" row-key="id" :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button type="link" size="small" @click="openPerm(record)">分配权限</a-button>
            <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑角色 -->
    <a-modal v-model:open="modalOpen" :title="editingId ? '编辑角色' : '新增角色'" :confirm-loading="modalLoading" @ok="submitForm">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="角色名称" required><a-input v-model:value="form.name" /></a-form-item>
        <a-form-item label="说明"><a-textarea v-model:value="form.description" :rows="3" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 分配权限 -->
    <a-modal v-model:open="permOpen" title="分配权限" :confirm-loading="permLoading" width="520px" @ok="submitPerm">
      <a-spin :spinning="permLoading">
        <a-tree
          v-model:checkedKeys="checkedKeys"
          checkable
          :tree-data="permTreeData"
          default-expand-all
          style="max-height:400px;overflow-y:auto"
        />
      </a-spin>
    </a-modal>
  </div>
</template>
