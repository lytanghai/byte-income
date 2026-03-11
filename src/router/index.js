import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Login from '../views/Login.vue' // You'll need to create this
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
        meta: { requiresGuest: true } // Only accessible when not logged in
    },
    {
        path: '/',
        component: DashboardLayout,
        meta: { requiresAuth: true }, // All dashboard routes require authentication
        children: [
            { path: '', redirect: '/overview' },
            { path: 'overview', component: Overview },
            { path: 'performance', component: Performance },
            { path: 'insight', component: Insight },
            { path: 'market', component: Market },
            { path: 'report', component: Report },
            { path: 'setting/users', component: Users },
            { path: 'setting/configuration', component: Configuration },
        ],
    },
    // Redirect any unknown paths to login
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    
    // If route requires auth and user is not authenticated
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
    }
    // If route is for guests only (like login) and user is authenticated
    else if (to.meta.requiresGuest && isAuthenticated) {
        next('/overview')
    }
    // Otherwise, proceed
    else {
        next()
    }
})

export default router