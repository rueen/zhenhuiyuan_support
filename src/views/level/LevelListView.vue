<script setup>
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getLevels, createLevel, updateLevel, deleteLevel } from '@/api/level'

const loading = ref(false)
const data = ref([])

const columns = [
  { title: '排序', dataIndex: 'sort', width: 70 },
  { title: '等级名称', dataIndex: 'name' },
  { title: '升级门槛（贡献值）', dataIndex: 'upgrade_threshold' },
  { title: '自购返利率', dataIndex: 'self_rebate_rate' },
  { title: '父级返利率', dataIndex: 'parent_rebate_rate' },
  { title: '祖父返利率', dataIndex: 'grandpa_rebate_rate' },
  { title: '分红池比例', dataIndex: 'dividend_pool_rate' },
  { title: '默认等级', dataIndex: 'is_default', width: 90 },
  { title: '操作', key: 'action', width: 120 },
]

async function fetchData() {
  loading.value = true
  try { data.value = await getLevels() } finally { loading.value = false }
}
onMounted(fetchData)

const modalOpen = ref(false)
const modalLoading = ref(false)
const editingId = ref(null)

const defaultForm = () => ({
  name: '', sort: 0, upgrade_threshold: 0,
  self_rebate_rate: '0.00', parent_rebate_rate: '0.00',
  grandpa_rebate_rate: '0.00', dividend_pool_rate: '0.00', is_default: 0,
})
const form = ref(defaultForm())

function openAdd() { editingId.value = null; form.value = defaultForm(); modalOpen.value = true }
function openEdit(record) {
  editingId.value = record.id
  form.value = { ...record }
  modalOpen.value = true
}

async function handleDelete(id) {
  Modal.confirm({
    title: '确定删除该等级？',
    onOk: async () => {
      await deleteLevel(id)
      message.success('已删除')
      fetchData()
    },
  })
}

async function submitForm() {
  modalLoading.value = true
  try {
    if (editingId.value) {
      await updateLevel(editingId.value, form.value)
    } else {
      await createLevel(form.value)
    }
    message.success(editingId.value ? '修改成功' : '新增成功')
    modalOpen.value = false
    fetchData()
  } finally {
    modalLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="action-bar">
      <span class="page-title">会员等级</span>
      <a-button type="primary" @click="openAdd">+ 新增等级</a-button>
    </div>
    <a-table :columns="columns" :data-source="data" :loading="loading" row-key="id" :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'is_default'">
          <a-tag :color="record.is_default ? 'blue' : 'default'">{{ record.is_default ? '是' : '否' }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="editingId ? '编辑等级' : '新增等级'"
      :confirm-loading="modalLoading"
      width="560px"
      @ok="submitForm"
    >
      <a-form layout="vertical" style="margin-top:8px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="等级名称" required><a-input v-model:value="form.name" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序"><a-input-number v-model:value="form.sort" style="width:100%" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="升级门槛（贡献值）"><a-input-number v-model:value="form.upgrade_threshold" style="width:100%" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="自购返利率"><a-input v-model:value="form.self_rebate_rate" placeholder="如 0.25" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="父级返利率"><a-input v-model:value="form.parent_rebate_rate" placeholder="如 0.20" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="祖父返利率"><a-input v-model:value="form.grandpa_rebate_rate" placeholder="如 0.10" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="分红池比例"><a-input v-model:value="form.dividend_pool_rate" placeholder="如 0.05" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="是否默认等级">
              <a-switch v-model:checked="form.is_default" :checked-value="1" :un-checked-value="0" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>
