<template>
    <div class="layout" :class="theme">
        <!-- Sidebar -->
        <aside class="sidebar" :class="{ open: isSidebarOpen }">
            <div class="sidebar-header">
                <h2 class="logo">Byte Income</h2>
                <button class="close-sidebar mobile-only" @click="closeSidebar">✕</button>
            </div>

            <!-- Wrap menu in container -->
            <div class="menu-container">
                <nav class="menu">
                    <RouterLink @click="closeSidebar" to="/overview">
                        <!-- <span class="menu-icon">📊</span> -->
                        <span class="menu-text">Overview</span>
                    </RouterLink>
                    <RouterLink @click="closeSidebar" to="/transaction">
                        <!-- <span class="menu-icon">📈</span> -->
                        <span class="menu-text">Transaction</span>
                    </RouterLink>
                    <RouterLink @click="closeSidebar" to="/performance">
                        <!-- <span class="menu-icon">📈</span> -->
                        <span class="menu-text">Performance</span>
                    </RouterLink>
                    <RouterLink @click="closeSidebar" to="/insight">
                        <!-- <span class="menu-icon">💡</span> -->
                        <span class="menu-text">Insight</span>
                    </RouterLink>
                    <RouterLink @click="closeSidebar" to="/market">
                        <!-- <span class="menu-icon">🏪</span> -->
                        <span class="menu-text">Market</span>
                    </RouterLink>
                    <RouterLink @click="closeSidebar" to="/report">
                        <!-- <span class="menu-icon">📄</span> -->
                        <span class="menu-text">Report</span>
                    </RouterLink>
                    
                    <div class="menu-group">
                        <div class="menu-parent" @click="toggleSetting">
                            <span class="menu-parent-content">
                                <!-- <span class="menu-icon">⚙️</span> -->
                                <span class="menu-text">Setting</span>
                            </span>
                            <span class="arrow">{{ settingOpen ? '▾' : '▸' }}</span>
                        </div>

                        <div v-if="settingOpen" class="submenu">
                            <RouterLink @click="closeSidebar" to="/setting/users">
                                <!-- <span class="menu-icon">👥</span> -->
                                <span class="menu-text">Users</span>
                            </RouterLink>

                            <RouterLink @click="closeSidebar" to="/setting/configuration">
                                <!-- <span class="menu-icon">⚙️</span> -->
                                <span class="menu-text">Configuration</span>
                            </RouterLink>
                        </div>
                    </div>
                </nav>
            </div>

            <div class="sidebar-footer">
                <div class="user-info mobile-only">
                    <div class="avatar small">?</div>
                    <span class="username">{{ (username || 'N/A').toUpperCase() }}</span>
                </div>
                <button class="logout-sidebar" @click="handleLogout">
                    <span class="menu-icon">⏻</span>
                    <span class="menu-text">Logout</span>
                </button>
            </div>
        </aside>

        <!-- Overlay (mobile) -->
        <div v-if="isSidebarOpen" class="overlay" @click="closeSidebar" />

        <!-- Main -->
        <div class="main">
            <!-- Header -->
            <header class="header">
                <div class="header-left">
                    <button class="menu-btn" @click="toggleSidebar">☰</button>
                    <h2 class="page-title mobile-only">{{ currentPageTitle }}</h2>
                </div>

                <div class="header-right">
                    <!-- Theme toggle -->
                    <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
                        {{ theme === 'dark' ? '🌙' : '☀️' }}
                    </button>

                    <!-- Profile section (desktop) -->
                    <div class="profile desktop-only">
                        <div class="avatar">?</div>
                        <span class="username">
                            {{ (username || 'N/A').toUpperCase() }}
                        </span>
                    </div>

                    <!-- Mobile profile button -->
                    <button class="profile-btn mobile-only" @click="toggleMobileProfile" v-if="!isMobileProfileOpen">
                        <div class="avatar small">?</div>
                    </button>
                </div>

                <!-- Mobile profile dropdown -->
                <div v-if="isMobileProfileOpen" class="mobile-profile-dropdown">
                    <div class="mobile-profile-header">
                        <div class="avatar large">?</div>
                        <span class="username-large">{{ (username || 'N/A').toUpperCase() }}</span>
                    </div>
                    <button class="mobile-logout-btn" @click="handleLogout">
                        <span>🚪 Logout</span>
                    </button>
                    <button class="close-dropdown" @click="toggleMobileProfile">✕</button>
                </div>
            </header>

            <!-- Content -->
            <main class="content">
                <router-view />
            </main>
        </div>
    </div>
</template>

<style scoped>
/* Root layout */
.layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg-page);
    color: var(--text-main);
    overflow: hidden;
}

/* Sidebar */
.sidebar {
    width: 260px;
    background: var(--bg-sidebar);
    color: white;
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
    z-index: 100;
    transition: transform 0.3s ease, width 0.3s ease;
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px 20px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
}

.close-sidebar {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
}

.close-sidebar:hover {
    background: rgba(255, 255, 255, 0.1);
}

/* Sidebar menu */
.menu-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px 12px;
}

.menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.menu a,
.menu-parent {
    padding: 12px 16px;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;
    cursor: pointer;
}

.menu a:hover,
.menu-parent:hover {
    background: rgba(255, 255, 255, 0.08);
}

.menu a.router-link-active {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    font-weight: 500;
}

.menu-icon {
    font-size: 1.2rem;
    min-width: 24px;
    text-align: center;
}

.menu-text {
    flex: 1;
    white-space: nowrap;
}

/* Menu group */
.menu-group {
    display: flex;
    flex-direction: column;
}

.menu-parent {
    justify-content: space-between;
}

.menu-parent-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.arrow {
    font-size: 0.875rem;
}

.submenu {
    display: flex;
    flex-direction: column;
    margin-left: 36px;
    gap: 2px;
}

.submenu a {
    padding: 10px 16px;
    font-size: 0.9rem;
}

/* Sidebar footer */
.sidebar-footer {
    padding: 20px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    margin-bottom: 8px;
}

.logout-sidebar {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.08);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: background 0.2s;
    font-size: 1rem;
}

.logout-sidebar:hover {
    background: rgba(255, 255, 255, 0.15);
}

/* Main area */
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100vh;
    overflow: hidden;
}

/* Header */
.header {
    height: 55px;
    background: var(--bg-header);
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    position: relative;
    z-index: 90;
}

.header-left,
.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.page-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-main);
}

/* Menu button */
.menu-btn {
    display: none;
    font-size: 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-main);
    padding: 8px;
    border-radius: 8px;
}

.menu-btn:hover {
    background: rgba(0, 0, 0, 0.05);
}

/* Profile section */
.profile {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #9ca3af;
    color: white;
    font-size: 1.25rem;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
}

.avatar.small {
    width: 32px;
    height: 32px;
    font-size: 1rem;
}

.avatar.large {
    width: 60px;
    height: 60px;
    font-size: 1.75rem;
}

.username {
    font-weight: 500;
    font-size: 0.95rem;
}

.username-large {
    font-weight: 600;
    font-size: 1.25rem;
}

/* Theme toggle button */
.theme-toggle {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 8px;
    border-radius: 8px;
    color: var(--text-main);
}

.theme-toggle:hover {
    background: rgba(0, 0, 0, 0.05);
}

/* Mobile profile button */
.profile-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
}

.profile-btn:hover {
    background: rgba(0, 0, 0, 0.05);
}

/* Mobile profile dropdown */
.mobile-profile-dropdown {
    position: absolute;
    top: 70px;
    right: 16px;
    background: var(--bg-panel);
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    min-width: 250px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 100;
}

.mobile-profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.mobile-logout-btn {
    width: 100%;
    padding: 12px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.mobile-logout-btn:hover {
    background: #dc2626;
}

.close-dropdown {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--text-main);
    padding: 4px 8px;
    border-radius: 4px;
}

.close-dropdown:hover {
    background: rgba(0, 0, 0, 0.05);
}

/* Content */
.content {
    flex: 1;
    padding: 24px;
    margin: 16px;
    background: var(--bg-panel);
    border-radius: 12px;
    overflow-y: auto;
    color: var(--text-main);
    transition: margin 0.3s ease, padding 0.3s ease;
}

/* Overlay */
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 95;
    backdrop-filter: blur(4px);
}

/* Responsive utilities */
.mobile-only {
    display: none !important;
}

.desktop-only {
    display: flex !important;
}

/* Theme variables */
.layout.light {
    --bg-page: #f3f4f6;
    --bg-panel: #ffffff;
    --bg-header: #ffffff;
    --bg-sidebar: #1f2937;
    --text-main: #111827;
}

.layout.dark {
    --bg-page: #0f172a;
    --bg-panel: #1e293b;
    --bg-header: #1e293b;
    --bg-sidebar: #0f172a;
    --text-main: #e5e7eb;
}

/* Transitions */
.layout,
.sidebar,
.header,
.content,
.logout-sidebar,
.logout-btn,
.avatar,
.menu a,
.theme-toggle {
    transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

/* Tablet styles (768px - 1024px) */
@media (max-width: 1024px) {
    .sidebar {
        width: 240px;
    }
    
    .content {
        padding: 20px;
        margin: 12px;
    }
}

/* Mobile styles (up to 768px) */
@media (max-width: 768px) {
    .mobile-only {
        display: flex !important;
    }
    
    .desktop-only {
        display: none !important;
    }

    .menu-btn {
        display: block;
    }

    .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
        width: 280px;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .header {
        height: 60px;
        padding: 0 16px;
    }

    .content {
        margin: 8px;
        padding: 16px;
        border-radius: 8px;
    }

    .logo {
        font-size: 1.1rem;
    }

    .menu-icon {
        font-size: 1.1rem;
    }

    .menu-text {
        font-size: 0.95rem;
    }

    /* Smaller padding for menu items on mobile */
    .menu a,
    .menu-parent,
    .logout-sidebar {
        padding: 10px 12px;
    }

    .submenu {
        margin-left: 32px;
    }
}

/* Small mobile styles (up to 480px) */
@media (max-width: 480px) {
    .sidebar {
        width: 100%;
        max-width: 280px;
    }

    .content {
        margin: 4px;
        padding: 12px;
    }

    .header {
        padding: 0 12px;
    }

    .mobile-profile-dropdown {
        right: 8px;
        left: 8px;
        min-width: auto;
    }

    .avatar.large {
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
    }

    .username-large {
        font-size: 1.1rem;
    }
}

/* Landscape mode on mobile */
@media (max-width: 768px) and (orientation: landscape) {
    .sidebar {
        width: 240px;
    }

    .content {
        margin: 8px;
        padding: 12px;
    }

    .menu-container {
        padding: 12px 8px;
    }

    .menu a,
    .menu-parent,
    .logout-sidebar {
        padding: 8px 12px;
    }
}

/* High-resolution tablets */
@media (min-width: 1024px) and (max-width: 1366px) {
    .sidebar {
        width: 250px;
    }

    .content {
        padding: 22px;
        margin: 14px;
    }
}

/* Large desktop screens */
@media (min-width: 1920px) {
    .sidebar {
        width: 280px;
    }

    .content {
        padding: 28px;
        margin: 20px;
        max-width: 1600px;
        margin-left: auto;
        margin-right: auto;
    }

    .logo {
        font-size: 1.5rem;
    }

    .menu-text {
        font-size: 1.1rem;
    }
}
</style>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isSidebarOpen = ref(false)
const theme = ref('light')
const settingOpen = ref(false)
const username = ref('')
const isMobileProfileOpen = ref(false)

// Compute current page title for mobile
const currentPageTitle = computed(() => {
    const path = route.path
    if (path.includes('overview')) return 'Overview'
    if (path.includes('performance')) return 'Performance'
    if (path.includes('insight')) return 'Insight'
    if (path.includes('market')) return 'Market'
    if (path.includes('report')) return 'Report'
    if (path.includes('setting')) return 'Settings'
    return 'Dashboard'
})

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
    if (isSidebarOpen.value) {
        isMobileProfileOpen.value = false
    }
}

const closeSidebar = () => {
    isSidebarOpen.value = false
}

const toggleSetting = () => {
    settingOpen.value = !settingOpen.value
}

const toggleMobileProfile = () => {
    isMobileProfileOpen.value = !isMobileProfileOpen.value
    if (isMobileProfileOpen.value) {
        isSidebarOpen.value = false
    }
}

const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('userData')
    
    // Redirect to login page
    router.push('/login')
}

/* Theme toggle */
const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
}

onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) theme.value = savedTheme

    // Load username from localStorage
    const userData = localStorage.getItem('userData')
    if (userData) {
        try {
            const parsed = JSON.parse(userData)
            username.value = parsed.username || ''
        } catch (e) {
            console.error('Error parsing userData:', e)
        }
    }

    // Close sidebar when route changes on mobile
    router.afterEach(() => {
        if (window.innerWidth <= 768) {
            isSidebarOpen.value = false
            isMobileProfileOpen.value = false
        }
    })

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            isSidebarOpen.value = false
            isMobileProfileOpen.value = false
        }
    })
})
</script>