<script setup>
import { useAuthStore } from '@/store/auth'
const auth = useAuthStore()
</script>

<template>
  <div class="dashboard">
    <a-result
      status="success"
      :title="`欢迎回来，${auth.admin?.real_name || auth.admin?.username || '管理员'}`"
      sub-title="贞慧缘电商平台管理端，请从左侧菜单进入各功能模块"
    />
  </div>
</template>

<style lang="less" scoped>
.dashboard {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>
