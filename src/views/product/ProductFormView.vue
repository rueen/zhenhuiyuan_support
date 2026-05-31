<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getProduct, createProduct, updateProduct, getCategories } from '@/api/product'
import { getShippingTemplates } from '@/api/shipping'
import { getOssSignature } from '@/api/oss'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const pageLoading = ref(false)
const submitLoading = ref(false)

const categoryOptions = ref([])
const shippingOptions = ref([])

const form = reactive({
  name: '',
  price: '',
  category_id: undefined,
  cover: '',
  main_images: [],
  weight: 0,
  stock: 0,
  status: 1,
  detail_images: [],
  shipping_template_id: undefined,
  sort: 0,
})

const coverFileList = ref([])
const mainFileList = ref([])
const detailFileList = ref([])

async function customUpload({ file, onSuccess, onError }) {
  try {
    const sig = await getOssSignature('products')
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

function handleCoverChange({ fileList }) {
  coverFileList.value = fileList
  const done = fileList.find(f => f.status === 'done')
  if (done) form.cover = done.response?.url || ''
}

function handleMainChange({ fileList }) {
  mainFileList.value = fileList
  form.main_images = fileList.filter(f => f.status === 'done').map(f => f.response?.url || f.url || '')
}

function handleDetailChange({ fileList }) {
  detailFileList.value = fileList
  form.detail_images = fileList.filter(f => f.status === 'done').map(f => f.response?.url || f.url || '')
}

async function fetchFormData() {
  const [cats, shippings] = await Promise.all([getCategories(), getShippingTemplates()])
  categoryOptions.value = cats
  shippingOptions.value = shippings
}

async function fetchProduct() {
  if (!isEdit.value) return
  pageLoading.value = true
  try {
    const data = await getProduct(route.params.id)
    Object.assign(form, data)
    if (data.cover) coverFileList.value = [{ uid: '-1', name: 'cover', status: 'done', url: data.cover, response: { url: data.cover } }]
    if (data.main_images?.length) {
      mainFileList.value = data.main_images.map((url, i) => ({ uid: `main_${i}`, name: `main_${i}`, status: 'done', url, response: { url } }))
    }
    if (data.detail_images?.length) {
      detailFileList.value = data.detail_images.map((url, i) => ({ uid: String(-i - 2), name: `detail_${i}`, status: 'done', url, response: { url } }))
    }
  } finally { pageLoading.value = false }
}

onMounted(() => { fetchFormData(); fetchProduct() })

async function submit() {
  if (!form.name) return message.warning('请输入商品名称')
  if (!form.price) return message.warning('请输入价格')
  if (!form.category_id) return message.warning('请选择分类')
  submitLoading.value = true
  try {
    const payload = { ...form }
    if (isEdit.value) {
      await updateProduct(route.params.id, payload)
      message.success('修改成功')
    } else {
      await createProduct(payload)
      message.success('新增成功')
    }
    router.push('/products')
  } finally { submitLoading.value = false }
}
</script>

<template>
  <div>
    <a-page-header :title="isEdit ? '编辑商品' : '新增商品'" @back="router.push('/products')" style="padding:0 0 16px" />
    <a-spin :spinning="pageLoading">
      <a-form layout="vertical">
        <a-form-item label="商品名称" required>
          <a-input v-model:value="form.name" placeholder="请输入商品名称" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="价格（元）" required>
              <a-input v-model:value="form.price" placeholder="如 99.00" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="库存">
              <a-input-number v-model:value="form.stock" :min="0" style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="重量（g）">
              <a-input-number v-model:value="form.weight" :min="0" style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="排序">
              <a-input-number v-model:value="form.sort" style="width:100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="商品分类" required>
              <a-select v-model:value="form.category_id" placeholder="请选择" style="width:100%">
                <a-select-option v-for="c in categoryOptions" :key="c.id" :value="c.id">{{ c.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="运费模板">
              <a-select v-model:value="form.shipping_template_id" placeholder="默认模板" allow-clear style="width:100%">
                <a-select-option v-for="s in shippingOptions" :key="s.id" :value="s.id">{{ s.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="状态">
              <a-switch v-model:checked="form.status" :checked-value="1" :un-checked-value="0" checked-children="上架" un-checked-children="下架" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item>
          <template #label>
            封面图 <span style="font-size:12px;color:#aaa;font-weight:400;margin-left:6px">列表显示</span>
          </template>
          <a-upload
            v-model:file-list="coverFileList"
            list-type="picture-card"
            :max-count="1"
            :custom-request="customUpload"
            @change="handleCoverChange"
          >
            <div v-if="coverFileList.length < 1">
              <PlusOutlined />
              <div style="margin-top:8px">上传封面</div>
            </div>
          </a-upload>
        </a-form-item>

        <a-form-item>
          <template #label>
            主图 <span style="font-size:12px;color:#aaa;font-weight:400;margin-left:6px">详情页顶部轮播</span>
          </template>
          <a-upload
            v-model:file-list="mainFileList"
            list-type="picture-card"
            :max-count="9"
            :custom-request="customUpload"
            @change="handleMainChange"
          >
            <div v-if="mainFileList.length < 9">
              <PlusOutlined />
              <div style="margin-top:8px">上传</div>
            </div>
          </a-upload>
        </a-form-item>

        <a-form-item>
          <template #label>
            详情图 <span style="font-size:12px;color:#aaa;font-weight:400;margin-left:6px">详情页底部图文</span>
          </template>
          <a-upload
            v-model:file-list="detailFileList"
            list-type="picture-card"
            :max-count="9"
            :custom-request="customUpload"
            @change="handleDetailChange"
          >
            <div v-if="detailFileList.length < 9">
              <PlusOutlined />
              <div style="margin-top:8px">上传</div>
            </div>
          </a-upload>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="submitLoading" @click="submit">
              {{ isEdit ? '保存修改' : '立即创建' }}
            </a-button>
            <a-button @click="router.push('/products')">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>
