<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

/** localStorage 存储 key */
const REMEMBER_KEY = 'login_remember'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({ username: '', password: '' })

/** 页面挂载时，若之前勾选过"记住密码"则自动填充 */
onMounted(() => {
  const saved = localStorage.getItem(REMEMBER_KEY)
  if (saved) {
    const { username, password } = JSON.parse(saved)
    form.username = username || ''
    form.password = password || ''
    rememberMe.value = true
  }
})

async function handleLogin() {
  if (!form.username) return message.warning('请输入用户名')
  if (!form.password) return message.warning('请输入密码')
  try {
    loading.value = true
    const data = await login(form)
    auth.setLogin(data)

    if (rememberMe.value) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username: form.username, password: form.password }))
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }

    message.success('登录成功')
    const redirect = route.query.redirect || '/dashboard'
    router.replace(redirect)
  } catch (err) {
    message.error(err?.response?.data?.message || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-box">
      <div class="login-header">
        <h1 class="login-title">贞慧缘</h1>
        <p class="login-sub">管理端</p>
      </div>
      <a-form layout="vertical" :model="form" @finish="handleLogin">
        <a-form-item label="用户名" required>
          <a-input
            v-model:value="form.username"
            size="large"
            placeholder="请输入用户名"
            allow-clear
            autocomplete="username"
          />
        </a-form-item>
        <a-form-item label="密码" required>
          <a-input-password
            v-model:value="form.password"
            size="large"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </a-form-item>
        <a-form-item style="margin-bottom:16px">
          <a-checkbox v-model:checked="rememberMe">记住密码</a-checkbox>
        </a-form-item>
        <a-form-item style="margin-top:0">
          <a-button type="primary" html-type="submit" size="large" block :loading="loading">
            登 录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<style lang="less" scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f4ff 0%, #fff 50%, #f0faf0 100%);
}

.login-box {
  width: 400px;
  padding: 40px 40px 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, .1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #0d1b2a;
  letter-spacing: .1em;
  margin-bottom: 4px;
}

.login-sub {
  font-size: 14px;
  color: rgba(0,0,0,.45);
}
</style>
