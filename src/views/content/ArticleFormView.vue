<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { createEditor, createToolbar } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import { getArticle, createArticle, updateArticle, getArticleColumns } from '@/api/article'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const pageLoading = ref(false)
const submitLoading = ref(false)
const columnOptions = ref([])

const form = reactive({
  title: '',
  content: '',
  location: '',
  column_id: undefined,
  sort: 0,
  status: 1,
})

/** WangEditor 实例（shallowRef 避免深度代理破坏编辑器内部状态） */
const editorInstance = ref(null)
const toolbarRef = ref(null)
const editorRef = ref(null)

/** location 合法性校验（与栏目保持一致） */
const locationReg = /^[a-z0-9_-]+$/

function initEditor(initialHtml = '') {
  const editor = createEditor({
    selector: editorRef.value,
    html: initialHtml,
    config: {
      placeholder: '请输入正文内容...',
      onChange(e) {
        form.content = e.getHtml()
      },
    },
    mode: 'default',
  })
  createToolbar({
    editor,
    selector: toolbarRef.value,
    mode: 'default',
  })
  editorInstance.value = editor
}

async function fetchColumns() {
  const res = await getArticleColumns()
  columnOptions.value = Array.isArray(res) ? res : (res.list ?? [])
}

async function fetchArticle() {
  if (!isEdit.value) return ''
  pageLoading.value = true
  try {
    const data = await getArticle(route.params.id)
    form.title = data.title
    form.content = data.content ?? ''
    form.location = data.location ?? ''
    form.column_id = data.column_id ?? undefined
    form.sort = data.sort ?? 0
    form.status = data.status ?? 1
    return data.content ?? ''
  } finally {
    pageLoading.value = false
  }
}

onMounted(async () => {
  await fetchColumns()
  const initialHtml = await fetchArticle()
  initEditor(initialHtml)
})

onBeforeUnmount(() => {
  editorInstance.value?.destroy()
})

async function submit() {
  if (!form.title.trim()) return message.warning('请输入文章标题')
  if (!form.content || form.content === '<p><br></p>') return message.warning('请输入正文内容')
  if (form.location && !locationReg.test(form.location)) {
    return message.warning('location 只允许小写字母、数字、下划线、连字符')
  }
  submitLoading.value = true
  try {
    const payload = {
      title: form.title,
      content: form.content,
      location: form.location || null,
      column_id: form.column_id ?? null,
      sort: form.sort,
      status: form.status,
    }
    if (isEdit.value) {
      await updateArticle(route.params.id, payload)
      message.success('修改成功')
    } else {
      await createArticle(payload)
      message.success('新增成功')
    }
    router.push('/content/articles')
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <div>
    <a-page-header
      :title="isEdit ? '编辑文章' : '新增文章'"
      style="padding:0 0 16px"
      @back="router.push('/content/articles')"
    />
    <a-spin :spinning="pageLoading">
      <a-form
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="文章标题" required>
          <a-input
            v-model:value="form.title"
            placeholder="请输入文章标题，最长 100 字"
            :maxlength="100"
            show-count
            style="width: 400px;"
          />
        </a-form-item>

        <a-form-item label="所属栏目">
          <a-select
            v-model:value="form.column_id"
            placeholder="不归属任何栏目"
            allow-clear
            style="width: 400px;"
          >
            <a-select-option v-for="c in columnOptions" :key="c.id" :value="c.id">
              {{ c.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="location 标识">
          <a-input
            v-model:value="form.location"
            placeholder="如 privacy-policy"
            :maxlength="64"
            style="width: 400px;"
          />
        </a-form-item>

        <a-form-item label="排序">
          <a-input-number v-model:value="form.sort" style="width: 400px;" />
        </a-form-item>
        
        <a-form-item label="状态">
          <a-radio-group v-model:value="form.status">
            <a-radio :value="1">发布</a-radio>
            <a-radio :value="0">草稿</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="正文内容" required>
          <div class="editor-wrap">
            <div ref="toolbarRef" class="editor-toolbar"></div>
            <div ref="editorRef" class="editor-body"></div>
          </div>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="submitLoading" @click="submit">
              {{ isEdit ? '保存修改' : '立即创建' }}
            </a-button>
            <a-button @click="router.push('/content/articles')">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<style scoped>
.editor-wrap {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  border-bottom: 1px solid #d9d9d9;
}

.editor-body {
  height: 450px;
  overflow-y: auto;
}
</style>
