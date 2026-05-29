<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  DashboardOutlined, TeamOutlined, TrophyOutlined, ShoppingOutlined,
  CarOutlined, FileTextOutlined, WalletOutlined, BarChartOutlined,
  SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined, DownOutlined,
  KeyOutlined, LogoutOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/store/auth'
import { resetAdminPassword } from '@/api/admin'

const collapsed = ref(false)
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const selectedKeys = ref([])
const openKeys = ref([])

// 根据当前路径自动选中菜单项和展开子菜单
watch(() => route.path, (path) => {
  if (path.startsWith('/products') || path.startsWith('/categories')) {
    openKeys.value = ['products']
    selectedKeys.value = path.startsWith('/categories') ? ['/categories'] : ['/products']
  } else if (path.startsWith('/system')) {
    openKeys.value = ['system']
    selectedKeys.value = [path]
  } else {
    selectedKeys.value = [path === '/' ? '/dashboard' : path.replace(/\/\d+.*/, '')]
  }
}, { immediate: true })

const breadcrumb = computed(() => {
  return route.matched.filter(r => r.meta?.title).map(r => r.meta.title)
})

function onMenuClick({ key }) {
  router.push(key)
}

// 退出登录
function logout() {
  auth.logout()
  router.replace('/login')
}

// 修改密码
const pwdOpen = ref(false)
const pwdLoading = ref(false)
const pwdForm = ref({ newPassword: '', confirmPassword: '' })

async function submitPwd() {
  if (!pwdForm.value.newPassword) return message.warning('请输入新密码')
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) return message.warning('两次密码不一致')
  try {
    pwdLoading.value = true
    await resetAdminPassword(auth.admin?.id, { password: pwdForm.value.newPassword })
    message.success('密码修改成功，请重新登录')
    pwdOpen.value = false
    auth.logout()
    router.replace('/login')
  } finally {
    pwdLoading.value = false
  }
}

function onUserMenu({ key }) {
  if (key === 'pwd') { pwdForm.value = { newPassword: '', confirmPassword: '' }; pwdOpen.value = true }
  if (key === 'logout') logout()
}
</script>

<template>
  <a-layout class="admin-root">
    <a-layout-sider
      v-model:collapsed="collapsed"
      class="admin-sider"
      :width="220"
      :collapsed-width="64"
      collapsible
      :trigger="null"
      theme="dark"
    >
      <div class="sider-logo">
        <span v-if="!collapsed" class="logo-full">贞慧缘 · 管理端</span>
        <span v-else class="logo-mini">贞</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        class="admin-menu"
        theme="dark"
        mode="inline"
        :inline-indent="16"
        @click="onMenuClick"
      >
        <a-menu-item key="/dashboard">
          <template #icon><DashboardOutlined /></template>
          工作台
        </a-menu-item>
        <a-menu-item key="/members">
          <template #icon><TeamOutlined /></template>
          会员管理
        </a-menu-item>
        <a-menu-item key="/levels">
          <template #icon><TrophyOutlined /></template>
          会员等级
        </a-menu-item>
        <a-sub-menu key="products">
          <template #icon><ShoppingOutlined /></template>
          <template #title>商品管理</template>
          <a-menu-item key="/categories">商品分类</a-menu-item>
          <a-menu-item key="/products">商品列表</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="/shipping">
          <template #icon><CarOutlined /></template>
          运费模板
        </a-menu-item>
        <a-menu-item key="/orders">
          <template #icon><FileTextOutlined /></template>
          订单管理
        </a-menu-item>
        <a-menu-item key="/withdrawals">
          <template #icon><WalletOutlined /></template>
          提现管理
        </a-menu-item>
        <a-menu-item key="/dividends">
          <template #icon><BarChartOutlined /></template>
          业绩分红
        </a-menu-item>
        <a-sub-menu key="system">
          <template #icon><SettingOutlined /></template>
          <template #title>系统管理</template>
          <a-menu-item key="/system/roles">角色管理</a-menu-item>
          <a-menu-item key="/system/admins">管理员</a-menu-item>
          <a-menu-item key="/system/logs">操作日志</a-menu-item>
          <a-menu-item key="/system/config">系统配置</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>

    <a-layout class="main-wrap">
      <a-layout-header class="main-header">
        <div class="header-left">
          <a-button type="text" class="collapse-btn" @click="collapsed = !collapsed">
            <MenuUnfoldOutlined v-if="collapsed" />
            <MenuFoldOutlined v-else />
          </a-button>
          <a-breadcrumb>
            <a-breadcrumb-item v-for="(b, i) in breadcrumb" :key="i">{{ b }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-dropdown placement="bottomRight">
            <a class="user-entry" @click.prevent>
              <a-avatar size="small" style="background:#1677ff">
                {{ (auth.admin?.real_name || auth.admin?.username || '管')[0] }}
              </a-avatar>
              <span class="user-name">{{ auth.admin?.real_name || auth.admin?.username || '管理员' }}</span>
              <DownOutlined style="font-size:10px;color:rgba(0,0,0,.45)" />
            </a>
            <template #overlay>
              <a-menu @click="onUserMenu">
                <a-menu-item key="pwd"><KeyOutlined /> 修改密码</a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout"><LogoutOutlined /> 退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content class="main-content">
        <div class="page-card">
          <RouterView />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>

  <!-- 修改密码弹窗 -->
  <a-modal v-model:open="pwdOpen" title="修改密码" :confirm-loading="pwdLoading" ok-text="确认修改" @ok="submitPwd">
    <a-form layout="vertical" style="margin-top:8px">
      <a-form-item label="新密码" required>
        <a-input-password v-model:value="pwdForm.newPassword" placeholder="请输入新密码（6~32位）" />
      </a-form-item>
      <a-form-item label="确认密码" required>
        <a-input-password v-model:value="pwdForm.confirmPassword" placeholder="请再次输入新密码" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style lang="less" scoped>
.admin-root { min-height: 100vh; }

.admin-sider {
  &:global(.ant-layout-sider-dark) { background: #0d1b2a !important; }
}

.sider-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  white-space: nowrap;
  overflow: hidden;
}

.logo-full { letter-spacing: .05em; }
.logo-mini { font-size: 18px; }

.main-wrap {
  min-height: 100vh;
  background: #f0f2f5;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  line-height: 56px;
  padding: 0 20px;
  background: #fff !important;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,21,41,.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  font-size: 18px;
  color: rgba(0,0,0,.65);
}

.header-right { flex-shrink: 0; }

.user-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(0,0,0,.85);
  cursor: pointer;
  text-decoration: none;
}

.user-name { font-size: 14px; }

.main-content {
  padding: 16px 20px 24px;
  min-height: calc(100vh - 56px);
}

.page-card {
  min-height: calc(100vh - 56px - 40px);
  padding: 20px 24px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,.03);
}
</style>
