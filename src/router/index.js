// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Login from '../views/Login.vue'
import Overview from '../views/Overview.vue'
import Performance from '../views/Performance.vue'
import Insight from '../views/Insight.vue'
import Transaction from '../views/Transaction.vue'
import Market from '../views/Market.vue'
import Report from '../views/Report.vue'
import Users from '../views/Users.vue'
import Cache from '../views/Cache.vue'
import Configuration from '../views/Configuration.vue'

// Import the token check function
import Calculator from '../views/Calculator.vue'
import Polymarket from '../views/Polymarket.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true } // Only for non-authenticated users
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true }, // All child routes require authentication
    children: [
      { path: '', redirect: '/overview' }, // Default route
      { path: 'overview', name: 'Overview', component: Overview },
      { path: 'cache', name: 'Cache', component: Cache },
      { path: 'transaction', name: 'Transaction', component: Transaction },
      { path: 'performance', name: 'Performance', component: Performance },
      { path: 'insight', name: 'Insight', component: Insight },
      { path: 'market', name: 'Market', component: Market },
      { path: 'report', name: 'Report', component: Report },
      { path: 'calculator', name: 'Calculator', component: Calculator},
      { path: 'polymarket', name: 'Polymarket', component: Polymarket},
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

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration
    if (!payload.exp) return false;
    
    // Compare expiration time with current time
    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    console.error('Error parsing token:', e);
    return true;
  }
};

// ------------------------
// Enhanced Navigation Guard
// ------------------------
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  const token = localStorage.getItem('authToken')
  
  // Check if token exists but is expired
  if (isAuthenticated && token && isTokenExpired(token)) {
    // Clear expired session
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    localStorage.removeItem('rememberMe');
    
    // Save the intended destination to redirect after login
    if (to.path !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', to.path);
    }
    
    // Redirect to login with message
    // console.log('Token expired, redirecting to login');
    alert("Token Expired! Please re-login!")
    return next('/login');
  }

  // Protected route, user not logged in
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Save the intended destination
    sessionStorage.setItem('redirectAfterLogin', to.path);
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