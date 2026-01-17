import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Overview from '../views/Overview.vue'
import Income from '../views/Income.vue'
import Expense from '../views/Expense.vue'
import Report from '../views/Report.vue'
import Setting from '../views/Setting.vue'

const routes = [
    {
        path: '/',
        component: DashboardLayout,
        children: [
            { path: '', redirect: '/overview' },
            { path: 'overview', component: Overview },
            { path: 'income', component: Income },
            { path: 'expense', component: Expense },
            { path: 'report', component: Report },
            { path: 'setting', component: Setting },
        ],
    },
]

export default createRouter({
    history: createWebHistory(),
    routes,
})
