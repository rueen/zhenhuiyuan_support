import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
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
        { path: 'dashboard',           name: 'dashboard',       component: () => import('@/views/DashboardView.vue'),                     meta: { title: '工作台' } },
        { path: 'members',             name: 'members',         component: () => import('@/views/member/MemberListView.vue'),              meta: { title: '会员管理',    perm: 'member' } },
        { path: 'members/:id',         name: 'member-detail',   component: () => import('@/views/member/MemberDetailView.vue'),            meta: { title: '会员详情',    perm: 'member' } },
        { path: 'levels',              name: 'levels',          component: () => import('@/views/level/LevelListView.vue'),                meta: { title: '会员等级',    perm: 'level' } },
        { path: 'categories',          name: 'categories',      component: () => import('@/views/product/CategoryListView.vue'),           meta: { title: '商品分类',    perm: 'category' } },
        { path: 'products',            name: 'products',        component: () => import('@/views/product/ProductListView.vue'),            meta: { title: '商品管理',    perm: 'product' } },
        { path: 'products/new',        name: 'product-new',     component: () => import('@/views/product/ProductFormView.vue'),            meta: { title: '新增商品',    perm: 'product' } },
        { path: 'products/:id/edit',   name: 'product-edit',    component: () => import('@/views/product/ProductFormView.vue'),            meta: { title: '编辑商品',    perm: 'product' } },
        { path: 'shipping',            name: 'shipping',        component: () => import('@/views/shipping/ShippingListView.vue'),          meta: { title: '运费模板',    perm: 'shipping' } },
        { path: 'shipping/new',        name: 'shipping-new',    component: () => import('@/views/shipping/ShippingFormView.vue'),          meta: { title: '新增运费模板', perm: 'shipping' } },
        { path: 'shipping/:id/edit',   name: 'shipping-edit',   component: () => import('@/views/shipping/ShippingFormView.vue'),          meta: { title: '编辑运费模板', perm: 'shipping' } },
        { path: 'orders',              name: 'orders',          component: () => import('@/views/order/OrderListView.vue'),                meta: { title: '订单管理',    perm: 'order' } },
        { path: 'orders/:id',          name: 'order-detail',    component: () => import('@/views/order/OrderDetailView.vue'),              meta: { title: '订单详情',    perm: 'order' } },
        { path: 'withdrawals',         name: 'withdrawals',     component: () => import('@/views/withdrawal/WithdrawalListView.vue'),       meta: { title: '提现管理',    perm: 'withdrawal' } },
        { path: 'dividends',           name: 'dividends',       component: () => import('@/views/dividend/DividendListView.vue'),           meta: { title: '业绩分红',    perm: 'dividend' } },
        { path: 'dividends/:id',       name: 'dividend-detail', component: () => import('@/views/dividend/DividendDetailView.vue'),         meta: { title: '分红周期详情', perm: 'dividend' } },
        { path: 'content/columns',              name: 'content-columns',      component: () => import('@/views/content/ColumnListView.vue'),            meta: { title: '栏目管理',    perm: 'article' } },
        { path: 'content/articles',             name: 'content-articles',     component: () => import('@/views/content/ArticleListView.vue'),           meta: { title: '文章列表',    perm: 'article' } },
        { path: 'content/articles/new',         name: 'content-article-new',  component: () => import('@/views/content/ArticleFormView.vue'),           meta: { title: '新增文章',    perm: 'article' } },
        { path: 'content/articles/:id/edit',    name: 'content-article-edit', component: () => import('@/views/content/ArticleFormView.vue'),           meta: { title: '编辑文章',    perm: 'article' } },
        { path: 'system/roles',        name: 'system-roles',    component: () => import('@/views/system/RoleListView.vue'),                meta: { title: '角色管理',    perm: 'role' } },
        { path: 'system/admins',       name: 'system-admins',   component: () => import('@/views/system/AdminListView.vue'),               meta: { title: '管理员管理',   perm: 'admin' } },
        { path: 'system/logs',         name: 'system-logs',     component: () => import('@/views/system/OperationLogView.vue'),            meta: { title: '操作日志',    perm: 'log' } },
        { path: 'system/config',       name: 'system-config',   component: () => import('@/views/system/ConfigView.vue'),                  meta: { title: '系统配置',    perm: 'config' } },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')

  // 未登录 → 跳登录页
  if (!to.meta.public && !token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 路由有权限要求时，检查当前用户是否持有该模块权限
  if (token && to.meta.perm) {
    const auth = useAuthStore()
    if (!auth.hasModule(to.meta.perm)) {
      // 无权限时重定向工作台，避免空白/报错页面
      return { path: '/dashboard' }
    }
  }
})

export default router
