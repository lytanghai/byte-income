// // router/index.js
// import { createRouter, createWebHistory } from 'vue-router'
// import DashboardLayout from '../layouts/DashboardLayout.vue'
// import Login from '../views/Login.vue'
// import Overview from '../views/Overview.vue'
// import Performance from '../views/Performance.vue'
// import Insight from '../views/Insight.vue'
// import Market from '../views/Market.vue'
// import Report from '../views/Report.vue'
// import Users from '../views/Users.vue'
// import Configuration from '../views/Configuration.vue'

// const routes = [
//   {
//     path: '/login',
//     name: 'Login',
//     component: Login,
//     meta: { requiresGuest: true } // Only for non-authenticated users
//   },
//   {
//     path: '/',
//     component: DashboardLayout,
//     meta: { requiresAuth: true }, // All child routes require authentication
//     children: [
//       { path: '', redirect: '/overview' }, // Default route
//       { path: 'overview', name: 'Overview', component: Overview },
//       { path: 'performance', name: 'Performance', component: Performance },
//       { path: 'insight', name: 'Insight', component: Insight },
//       { path: 'market', name: 'Market', component: Market },
//       { path: 'report', name: 'Report', component: Report },
//       { path: 'setting/users', name: 'Users', component: Users },
//       { path: 'setting/configuration', name: 'Configuration', component: Configuration },
//     ]
//   },
//   // Catch-all redirect to login
//   {
//     path: '/:pathMatch(.*)*',
//     redirect: '/login'
//   }
// ]

// const router = createRouter({
//   history: createWebHistory(),
//   routes
// })

// // ------------------------
// // Navigation Guard
// // ------------------------
// router.beforeEach((to, from, next) => {
//   const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'

//   // Protected route, user not logged in
//   if (to.meta.requiresAuth && !isAuthenticated) {
//     return next('/login')
//   }

//   // Guest route, user already logged in
//   if (to.meta.requiresGuest && isAuthenticated) {
//     return next('/overview')
//   }

//   // Otherwise proceed
//   return next()
// })

// export default router   



// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Login from '../views/Login.vue'
import Overview from '../views/Overview.vue'
import Performance from '../views/Performance.vue'
import Insight from '../views/Insight.vue'
import Market from '../views/Market.vue'
import Report from '../views/Report.vue'
import Users from '../views/Users.vue'
import Configuration from '../views/Configuration.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  // ADD THIS - Explicit redirect for /com/login
  {
    path: '/com/login',
    redirect: '/login'
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/overview' },
      { path: 'overview', name: 'Overview', component: Overview },
      { path: 'performance', name: 'Performance', component: Performance },
      { path: 'insight', name: 'Insight', component: Insight },
      { path: 'market', name: 'Market', component: Market },
      { path: 'report', name: 'Report', component: Report },
      { path: 'setting/users', name: 'Users', component: Users },
      { path: 'setting/configuration', name: 'Configuration', component: Configuration },
    ]
  },
  // Catch-all redirect to login
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'

  // Protected route, user not logged in
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  // Guest route, user already logged in
  if (to.meta.requiresGuest && isAuthenticated) {
    return next('/overview')
  }

  // Otherwise proceed
  return next()
})

export default router