import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const admin = ref(null)
  const permissions = ref([])

  function setLogin(data) {
    token.value = data.token
    admin.value = data.admin
    permissions.value = data.permissions || []
    localStorage.setItem('admin_token', data.token)
  }

  function logout() {
    token.value = ''
    admin.value = null
    permissions.value = []
    localStorage.removeItem('admin_token')
  }

  function hasPermission(perm) {
    return permissions.value.includes(perm)
  }

  return { token, admin, permissions, setLogin, logout, hasPermission }
})
