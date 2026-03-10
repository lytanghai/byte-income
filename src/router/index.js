import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Overview from '../views/Overview.vue'
import Performance from '../views/Performance.vue'
import Insight from '../views/Insight.vue'
import Market from '../views/Market.vue'
import Report from '../views/Report.vue'
import Users from '../views/Users.vue'
import Configuration from '../views/Configuration.vue'

const routes = [
    {
        path: '/',
        component: DashboardLayout,
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
]

export default createRouter({
    history: createWebHistory(),
    routes,
})
