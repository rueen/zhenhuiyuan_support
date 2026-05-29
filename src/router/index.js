import { createRouter, createWebHistory } from 'vue-router'
import BasicLayout from '@/layouts/BasicLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true, title: '登录' },
    },
    {
      path: '/',
      component: BasicLayout,
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: '工作台' } },
        { path: 'members', name: 'members', component: () => import('@/views/member/MemberListView.vue'), meta: { title: '会员管理' } },
        { path: 'members/:id', name: 'member-detail', component: () => import('@/views/member/MemberDetailView.vue'), meta: { title: '会员详情' } },
        { path: 'levels', name: 'levels', component: () => import('@/views/level/LevelListView.vue'), meta: { title: '会员等级' } },
        { path: 'categories', name: 'categories', component: () => import('@/views/product/CategoryListView.vue'), meta: { title: '商品分类' } },
        { path: 'products', name: 'products', component: () => import('@/views/product/ProductListView.vue'), meta: { title: '商品管理' } },
        { path: 'products/new', name: 'product-new', component: () => import('@/views/product/ProductFormView.vue'), meta: { title: '新增商品' } },
        { path: 'products/:id/edit', name: 'product-edit', component: () => import('@/views/product/ProductFormView.vue'), meta: { title: '编辑商品' } },
        { path: 'shipping', name: 'shipping', component: () => import('@/views/shipping/ShippingListView.vue'), meta: { title: '运费模板' } },
        { path: 'shipping/new', name: 'shipping-new', component: () => import('@/views/shipping/ShippingFormView.vue'), meta: { title: '新增运费模板' } },
        { path: 'shipping/:id/edit', name: 'shipping-edit', component: () => import('@/views/shipping/ShippingFormView.vue'), meta: { title: '编辑运费模板' } },
        { path: 'orders', name: 'orders', component: () => import('@/views/order/OrderListView.vue'), meta: { title: '订单管理' } },
        { path: 'orders/:id', name: 'order-detail', component: () => import('@/views/order/OrderDetailView.vue'), meta: { title: '订单详情' } },
        { path: 'withdrawals', name: 'withdrawals', component: () => import('@/views/withdrawal/WithdrawalListView.vue'), meta: { title: '提现管理' } },
        { path: 'dividends', name: 'dividends', component: () => import('@/views/dividend/DividendListView.vue'), meta: { title: '业绩分红' } },
        { path: 'dividends/:id', name: 'dividend-detail', component: () => import('@/views/dividend/DividendDetailView.vue'), meta: { title: '分红周期详情' } },
        { path: 'system/roles', name: 'system-roles', component: () => import('@/views/system/RoleListView.vue'), meta: { title: '角色管理' } },
        { path: 'system/admins', name: 'system-admins', component: () => import('@/views/system/AdminListView.vue'), meta: { title: '管理员管理' } },
        { path: 'system/logs', name: 'system-logs', component: () => import('@/views/system/OperationLogView.vue'), meta: { title: '操作日志' } },
        { path: 'system/config', name: 'system-config', component: () => import('@/views/system/ConfigView.vue'), meta: { title: '系统配置' } },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')
  if (!to.meta.public && !token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router
