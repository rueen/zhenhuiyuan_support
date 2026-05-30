import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getProfile } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const admin = ref(JSON.parse(localStorage.getItem('admin_info') || 'null'))
  const permissions = ref(JSON.parse(localStorage.getItem('admin_permissions') || '[]'))

  /**
   * 登录成功后写入登录态，并持久化到 localStorage（保证刷新后不丢失）
   * @param {{ token: string, admin: object, permissions: string[] }} data
   */
  function setLogin(data) {
    token.value = data.token
    admin.value = data.admin
    permissions.value = data.permissions || []
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_info', JSON.stringify(data.admin || null))
    localStorage.setItem('admin_permissions', JSON.stringify(data.permissions || []))
  }

  /** 从服务端拉取最新的管理员信息与权限，刷新本地缓存 */
  async function fetchProfile() {
    const data = await getProfile()
    // 兼容两种返回结构：{ admin, permissions } 或管理员字段直接平铺
    admin.value = 'admin' in data ? data.admin : data
    permissions.value = data.permissions || []
    localStorage.setItem('admin_info', JSON.stringify(admin.value || null))
    localStorage.setItem('admin_permissions', JSON.stringify(permissions.value))
  }

  function logout() {
    token.value = ''
    admin.value = null
    permissions.value = []
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_info')
    localStorage.removeItem('admin_permissions')
  }

  /**
   * 是否拥有指定权限码（精确匹配）
   * @param {string} perm
   * @returns {boolean}
   */
  function hasPermission(perm) {
    return permissions.value.includes(perm)
  }

  /**
   * 是否拥有某模块的任意权限（用于菜单/模块级显隐）
   * 权限码形如 `withdrawal`、`withdrawal:list`，按前缀匹配
   * @param {string} prefix - 模块前缀，如 'withdrawal'
   * @returns {boolean}
   */
  function hasModule(prefix) {
    return permissions.value.some(p => p === prefix || p.startsWith(`${prefix}:`))
  }

  return { token, admin, permissions, setLogin, fetchProfile, logout, hasPermission, hasModule }
})
