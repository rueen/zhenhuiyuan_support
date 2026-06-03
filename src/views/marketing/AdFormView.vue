<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getAd, createAd, updateAd, getAdPositions } from '@/api/ad'
import { getArticleColumns, getArticles } from '@/api/article'
import { getCategories, getProducts } from '@/api/product'
import { getOssSignature } from '@/api/oss'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const pageLoading = ref(false)
const submitLoading = ref(false)
const positionOptions = ref([])

const form = reactive({
  title: '',
  position_id: undefined,
  start_time: null,
  end_time: null,
  image: '',
  status: 1,
  link_type: 'none',
  link_value: '',
  sort: 0,
})

/** 广告图上传 */
const imageFileList = ref([])

async function customUpload({ file, onSuccess, onError }) {
  try {
    const sig = await getOssSignature('ads')
    const formData = new FormData()
    const key = `${sig.dir}${Date.now()}_${file.name}`
    formData.append('key', key)
    formData.append('OSSAccessKeyId', sig.accessKeyId)
    formData.append('policy', sig.policy)
    formData.append('signature', sig.signature)
    formData.append('success_action_status', '200')
    formData.append('file', file)
    await fetch(sig.host, { method: 'POST', body: formData })
    const url = `${sig.host}/${key}`
    onSuccess({ url }, file)
  } catch (e) {
    onError(e)
  }
}

function handleImageChange({ fileList }) {
  imageFileList.value = fileList
  const done = fileList.find(f => f.status === 'done')
  if (done) form.image = done.response?.url || ''
  if (!fileList.length) form.image = ''
}

/** 跳转链接类型配置 */
const LINK_TYPES = [
  { value: 'none', label: '无' },
  { value: 'article_column', label: '文章栏目', modal: true },
  { value: 'article_detail', label: '文章详情', modal: true },
  { value: 'product_category', label: '商品分类', modal: true },
  { value: 'product_detail', label: '商品详情', modal: true },
  { value: 'miniapp_page', label: '小程序内页', input: true, placeholder: '请输入页面路径，如 /pages/home/index' },
  { value: 'external_h5', label: '外部 H5 链接', input: true, placeholder: '请输入完整 URL，如 https://example.com' },
]

const currentLinkType = computed(() => LINK_TYPES.find(t => t.value === form.link_type))

/** 切换跳转类型时清空已选值 */
function onLinkTypeChange() {
  form.link_value = ''
  linkLabel.value = ''
}

/** 已选内容的展示文本（弹窗类型使用） */
const linkLabel = ref('')

/** 弹窗选择器状态 */
const pickerOpen = ref(false)
const pickerLoading = ref(false)
const pickerList = ref([])
const pickerTotal = ref(0)
const pickerPage = reactive({ current: 1, pageSize: 10 })
const pickerKeyword = ref('')
const pickerSelected = reactive({ id: '', label: '' })

/** 各类型的表格列配置 */
const PICKER_COLUMNS = {
  article_column: [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '栏目名称', dataIndex: 'name' },
    { title: 'location', dataIndex: 'location' },
  ],
  article_detail: [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '所属栏目', dataIndex: 'column_name', width: 120 },
  ],
  product_category: [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '分类名称', dataIndex: 'name' },
  ],
  product_detail: [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '商品名称', dataIndex: 'name', ellipsis: true },
    { title: '价格', dataIndex: 'price', width: 100 },
  ],
}

const pickerColumns = computed(() => PICKER_COLUMNS[form.link_type] ?? [])
const pickerTitle = computed(() => currentLinkType.value?.label ?? '')

async function fetchPickerList() {
  pickerLoading.value = true
  try {
    const kw = pickerKeyword.value || undefined
    let res
    if (form.link_type === 'article_column') {
      res = await getArticleColumns({ keyword: kw })
      const list = Array.isArray(res) ? res : (res.list ?? [])
      pickerList.value = list
      pickerTotal.value = list.length
    } else if (form.link_type === 'article_detail') {
      res = await getArticles({ keyword: kw, status: 1, page: pickerPage.current, pageSize: pickerPage.pageSize })
      pickerList.value = res.list ?? []
      pickerTotal.value = res.total ?? 0
    } else if (form.link_type === 'product_category') {
      res = await getCategories()
      const list = Array.isArray(res) ? res : (res.list ?? [])
      pickerList.value = list
      pickerTotal.value = list.length
    } else if (form.link_type === 'product_detail') {
      res = await getProducts({ keyword: kw, status: 1, page: pickerPage.current, pageSize: pickerPage.pageSize })
      pickerList.value = res.list ?? []
      pickerTotal.value = res.total ?? 0
    }
  } finally {
    pickerLoading.value = false
  }
}

function openPicker() {
  pickerKeyword.value = ''
  pickerPage.current = 1
  pickerSelected.id = form.link_value
  pickerSelected.label = linkLabel.value
  pickerOpen.value = true
  fetchPickerList()
}

function onPickerSearch() {
  pickerPage.current = 1
  fetchPickerList()
}

function onPickerTableChange(pag) {
  pickerPage.current = pag.current
  pickerPage.pageSize = pag.pageSize
  fetchPickerList()
}

function selectRow(record) {
  const nameField = form.link_type === 'article_detail' ? 'title' : 'name'
  pickerSelected.id = String(record.id)
  pickerSelected.label = record[nameField] ?? String(record.id)
}

function confirmPicker() {
  if (!pickerSelected.id) return message.warning('请选择一项')
  form.link_value = pickerSelected.id
  linkLabel.value = pickerSelected.label
  pickerOpen.value = false
}

/** 初始化数据 */
async function fetchPositions() {
  const res = await getAdPositions()
  positionOptions.value = Array.isArray(res) ? res : (res.list ?? [])
}

async function fetchAd() {
  if (!isEdit.value) return
  pageLoading.value = true
  try {
    const data = await getAd(route.params.id)
    form.title = data.title
    form.position_id = data.position_id
    form.start_time = data.start_time ? dayjs(data.start_time) : null
    form.end_time = data.end_time ? dayjs(data.end_time) : null
    form.image = data.image ?? ''
    form.status = data.status ?? 1
    form.link_type = data.link_type || 'none'
    form.link_value = data.link_value ?? ''
    form.sort = data.sort ?? 0
    if (data.image) {
      imageFileList.value = [{ uid: '-1', name: 'image', status: 'done', url: data.image, response: { url: data.image } }]
    }
    /** 回显 link_label：仅显示 ID，让用户知道已选，可重新选择 */
    if (data.link_value) linkLabel.value = data.link_label ?? data.link_value
  } finally {
    pageLoading.value = false
  }
}

onMounted(() => { fetchPositions(); fetchAd() })

async function submit() {
  if (!form.title.trim()) return message.warning('请输入广告标题')
  if (!form.position_id) return message.warning('请选择广告位置')
  if (!form.image) return message.warning('请上传广告图片')
  if (!form.start_time) return message.warning('请选择生效开始时间')
  if (!form.end_time) return message.warning('请选择生效结束时间')
  if (dayjs(form.end_time).isBefore(dayjs(form.start_time))) {
    return message.warning('结束时间须晚于开始时间')
  }
  submitLoading.value = true
  try {
    const payload = {
      title: form.title,
      position_id: form.position_id,
      start_time: dayjs(form.start_time).toISOString(),
      end_time: dayjs(form.end_time).toISOString(),
      image: form.image,
      status: form.status,
      link_type: form.link_type === 'none' ? '' : form.link_type,
      link_value: form.link_type === 'none' ? '' : form.link_value,
      sort: form.sort,
    }
    if (isEdit.value) {
      await updateAd(route.params.id, payload)
      message.success('修改成功')
    } else {
      await createAd(payload)
      message.success('新增成功')
    }
    router.push('/marketing/ads')
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <div>
    <a-page-header
      :title="isEdit ? '编辑广告' : '新增广告'"
      style="padding:0 0 16px"
      @back="router.push('/marketing/ads')"
    />
    <a-spin :spinning="pageLoading">
      <a-form
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="广告标题" required>
          <a-input v-model:value="form.title" placeholder="最长 100 字" :maxlength="100" show-count style="width: 400px;" />
        </a-form-item>

        <a-form-item label="广告位置" required>
          <a-select v-model:value="form.position_id" placeholder="请选择广告位置" style="width: 400px;">
            <a-select-option v-for="p in positionOptions" :key="p.id" :value="p.id">
              {{ p.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="排序">
          <a-input-number v-model:value="form.sort" style="width: 400px;" />
        </a-form-item>

        <a-form-item label="启用状态">
          <a-switch
            v-model:checked="form.status"
            :checked-value="1"
            :un-checked-value="0"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </a-form-item>

        <a-form-item label="生效时间" required>
          <a-space>
            <a-date-picker
              v-model:value="form.start_time"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择开始时间"
              style="width:100%"
            />
            <span>至</span>
            <a-date-picker
              v-model:value="form.end_time"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择结束时间"
              style="width:100%"
            />
          </a-space>
        </a-form-item>

        <a-form-item label="广告图片" required>
          <a-upload
            v-model:file-list="imageFileList"
            list-type="picture-card"
            :max-count="1"
            :custom-request="customUpload"
            @change="handleImageChange"
          >
            <div v-if="imageFileList.length < 1">
              <PlusOutlined />
              <div style="margin-top:8px">上传图片</div>
            </div>
          </a-upload>
          <div style="color:#aaa;font-size:12px;margin-top:4px">建议尺寸与广告位匹配，支持 JPG / PNG</div>
        </a-form-item>

        <a-form-item label="跳转链接">
          <a-row :gutter="12" align="middle">
            <a-col :span="6">
              <a-select v-model:value="form.link_type" style="width:100%" @change="onLinkTypeChange">
                <a-select-option v-for="t in LINK_TYPES" :key="t.value" :value="t.value">
                  {{ t.label }}
                </a-select-option>
              </a-select>
            </a-col>

            <!-- 弹窗选择类型 -->
            <a-col v-if="currentLinkType?.modal" :span="10">
              <a-input-group compact>
                <a-input
                  :value="linkLabel || (form.link_value ? `ID: ${form.link_value}` : '')"
                  placeholder="请点击右侧按钮选择"
                  readonly
                  style="width:calc(100% - 80px)"
                />
                <a-button type="primary" style="width:80px" @click="openPicker">选择</a-button>
              </a-input-group>
            </a-col>

            <!-- 输入框类型 -->
            <a-col v-else-if="currentLinkType?.input" :span="14">
              <a-input
                v-model:value="form.link_value"
                :placeholder="currentLinkType.placeholder"
              />
            </a-col>
          </a-row>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="submitLoading" @click="submit">
              {{ isEdit ? '保存修改' : '立即创建' }}
            </a-button>
            <a-button @click="router.push('/marketing/ads')">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-spin>

    <!-- 弹窗选择器 -->
    <a-modal
      v-model:open="pickerOpen"
      :title="`选择${pickerTitle}`"
      width="680px"
      ok-text="确定"
      cancel-text="取消"
      @ok="confirmPicker"
    >
      <div style="margin-bottom:12px">
        <a-input-search
          v-model:value="pickerKeyword"
          placeholder="输入关键词搜索"
          style="width:260px"
          @search="onPickerSearch"
          @press-enter="onPickerSearch"
        />
      </div>
      <a-table
        :columns="pickerColumns"
        :data-source="pickerList"
        :loading="pickerLoading"
        :pagination="pickerTotal > pickerPage.pageSize ? {
          current: pickerPage.current,
          pageSize: pickerPage.pageSize,
          total: pickerTotal,
          showTotal: t => `共 ${t} 条`,
        } : false"
        :row-class-name="(record) => String(record.id) === pickerSelected.id ? 'picker-row-selected' : ''"
        row-key="id"
        size="small"
        :scroll="{ y: 320 }"
        @change="onPickerTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'id'">
            <a
              style="cursor:pointer"
              :style="String(record.id) === pickerSelected.id ? 'color:#1677ff;font-weight:600' : ''"
              @click="selectRow(record)"
            >
              {{ record.id }}
            </a>
          </template>
          <template v-else>
            <span
              style="cursor:pointer"
              @click="selectRow(record)"
            >
              {{ record[column.dataIndex] ?? '—' }}
            </span>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<style scoped>
:deep(.picker-row-selected td) {
  background: #e6f4ff !important;
}
</style>
