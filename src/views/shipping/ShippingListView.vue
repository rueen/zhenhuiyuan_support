<!--
 * @Author: diaochan diaochan@seatent.com
 * @Date: 2026-05-29 20:59:12
 * @LastEditors: diaochan diaochan@seatent.com
 * @LastEditTime: 2026-05-30 17:46:35
 * @FilePath: /zhenhuiyuan_support/src/views/shipping/ShippingListView.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { getShippingTemplates, deleteShippingTemplate } from '@/api/shipping'

const router = useRouter()
const loading = ref(false)
const data = ref([])

const columns = [
  { title: '模板名称', dataIndex: 'name' },
  { title: '计费规则数', key: 'rules_count' },
  { title: '是否默认', key: 'is_default', width: 100 },
  { title: '操作', key: 'action', width: 120 },
]

async function fetchData() {
  loading.value = true
  try { data.value = await getShippingTemplates() } finally { loading.value = false }
}
onMounted(fetchData)

function handleDelete(id) {
  Modal.confirm({ title: '确定删除该运费模板？', onOk: async () => { await deleteShippingTemplate(id); message.success('已删除'); fetchData() } })
}
</script>

<template>
  <div>
    <div class="action-bar">
      <span class="page-title">运费模板</span>
      <a-button type="primary" @click="router.push('/shipping/new')" v-if="!data.length">+ 新增模板</a-button>
    </div>
    <a-table :columns="columns" :data-source="data" :loading="loading" row-key="id" :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'rules_count'">{{ record.rules?.length || 0 }} 条</template>
        <template v-else-if="column.key === 'is_default'">
          <a-tag :color="record.is_default ? 'blue' : 'default'">{{ record.is_default ? '是' : '否' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="router.push(`/shipping/${record.id}/edit`)">编辑</a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>
