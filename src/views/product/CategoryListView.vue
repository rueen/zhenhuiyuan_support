<!--
 * @Author: diaochan diaochan@seatent.com
 * @Date: 2026-05-29 20:59:11
 * @LastEditors: diaochan diaochan@seatent.com
 * @LastEditTime: 2026-05-30 17:23:03
 * @FilePath: /zhenhuiyuan_support/src/views/product/CategoryListView.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup>
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/product'

const loading = ref(false)
const data = ref([])

const columns = [
  { title: '分类名称', dataIndex: 'name' },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '操作', key: 'action', width: 120 },
]

async function fetchData() {
  loading.value = true
  try { data.value = await getCategories() } finally { loading.value = false }
}
onMounted(fetchData)

const modalOpen = ref(false)
const modalLoading = ref(false)
const editingId = ref(null)
const form = ref({ name: '', sort: 0, status: 1 })

function openAdd() { editingId.value = null; form.value = { name: '', sort: 0, status: 1 }; modalOpen.value = true }
function openEdit(r) { editingId.value = r.id; form.value = { name: r.name, sort: r.sort, status: r.status }; modalOpen.value = true }

function handleDelete(id) {
  Modal.confirm({ title: '确定删除该分类？', onOk: async () => { await deleteCategory(id); message.success('已删除'); fetchData() } })
}

async function submitForm() {
  modalLoading.value = true
  try {
    editingId.value ? await updateCategory(editingId.value, form.value) : await createCategory(form.value)
    message.success(editingId.value ? '修改成功' : '新增成功')
    modalOpen.value = false
    fetchData()
  } finally { modalLoading.value = false }
}
</script>

<template>
  <div>
    <div class="action-bar">
      <span class="page-title">商品分类</span>
      <a-button type="primary" @click="openAdd">+ 新增分类</a-button>
    </div>
    <a-table :columns="columns" :data-source="data" :loading="loading" row-key="id" :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 1 ? 'success' : 'default'">{{ record.status === 1 ? '启用' : '禁用' }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
        </template>
      </template>
    </a-table>
    <a-modal v-model:open="modalOpen" :title="editingId ? '编辑分类' : '新增分类'" :confirm-loading="modalLoading" @ok="submitForm">
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="分类名称" required><a-input v-model:value="form.name" /></a-form-item>
        <a-form-item label="排序"><a-input-number v-model:value="form.sort" style="width:100%" /></a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model:value="form.status">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
