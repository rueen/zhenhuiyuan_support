<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getAdPositions, createAdPosition, updateAdPosition, deleteAdPosition } from '@/api/ad'

const router = useRouter()
const loading = ref(false)
const dataSource = ref([])
const keyword = ref('')

const columns = [
  { title: '位置名称', dataIndex: 'name' },
  { title: 'location 标识', dataIndex: 'location' },
  { title: '广告数量', dataIndex: 'ad_count', width: 100 },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getAdPositions({ keyword: keyword.value || undefined })
    dataSource.value = Array.isArray(res) ? res : (res.list ?? [])
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)

function search() { fetchList() }
function reset() { keyword.value = ''; fetchList() }

/** Modal 新增/编辑 */
const modalOpen = ref(false)
const modalTitle = ref('')
const modalLoading = ref(false)
const editingId = ref(null)
const form = reactive({ name: '', location: '', sort: 0 })

const locationReg = /^[a-z0-9_-]+$/

function openCreate() {
  editingId.value = null
  modalTitle.value = '新建位置'
  Object.assign(form, { name: '', location: '', sort: 0 })
  modalOpen.value = true
}

function openEdit(record) {
  editingId.value = record.id
  modalTitle.value = '编辑位置'
  Object.assign(form, { name: record.name, location: record.location, sort: record.sort ?? 0 })
  modalOpen.value = true
}

async function handleOk() {
  if (!form.name.trim()) return message.warning('请输入位置名称')
  if (!form.location.trim()) return message.warning('请输入 location 标识')
  if (!locationReg.test(form.location)) return message.warning('location 只允许小写字母、数字、下划线、连字符')
  if (form.location.length > 64) return message.warning('location 最长 64 个字符')
  modalLoading.value = true
  try {
    if (editingId.value) {
      await updateAdPosition(editingId.value, { ...form })
      message.success('修改成功')
    } else {
      await createAdPosition({ ...form })
      message.success('新建成功')
    }
    modalOpen.value = false
    fetchList()
  } finally {
    modalLoading.value = false
  }
}

function handleDelete(record) {
  Modal.confirm({
    title: `确定删除位置「${record.name}」？`,
    content: '若该位置下存在广告，将无法删除，请先移除广告。',
    okType: 'danger',
    onOk: async () => {
      await deleteAdPosition(record.id)
      message.success('已删除')
      fetchList()
    },
  })
}
</script>

<template>
  <div>
    <a-page-header
      title="广告位置"
      style="padding:0 0 16px"
      @back="router.push('/marketing/ads')"
    />

    <div class="action-bar">
      <div class="filter-bar" style="margin-bottom:0">
        <a-input
          v-model:value="keyword"
          placeholder="搜索位置名称"
          style="width:220px"
          allow-clear
          @press-enter="search"
        />
        <a-button type="primary" @click="search">查询</a-button>
        <a-button @click="reset">重置</a-button>
      </div>
      <a-button type="primary" @click="openCreate">+ 新建位置</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑弹窗 -->
    <a-modal
      v-model:open="modalOpen"
      :title="modalTitle"
      :confirm-loading="modalLoading"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleOk"
    >
      <a-form layout="vertical" style="margin-top:8px">
        <a-form-item label="位置名称" required>
          <a-input v-model:value="form.name" placeholder="最长 50 字" :maxlength="50" show-count />
        </a-form-item>
        <a-form-item required>
          <template #label>
            location 标识
            <span style="font-size:12px;color:#aaa;font-weight:400;margin-left:6px">C 端通过此标识获取该位置广告</span>
          </template>
          <a-input
            v-model:value="form.location"
            placeholder="小写字母/数字/下划线/连字符，如 home-banner"
            :maxlength="64"
          />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="form.sort" style="width:120px" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
