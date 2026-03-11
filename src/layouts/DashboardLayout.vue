<template>
    <div class="layout" :class="theme">
        <!-- Sidebar -->
        <aside class="sidebar" :class="{ open: isSidebarOpen }">
            <h2 class="logo">Byte Income</h2>

            <!-- Wrap menu in container -->
            <div class="menu-container">
                <nav class="menu">
                    <RouterLink @click="closeSidebar" to="/overview">Overview</RouterLink>
                    <RouterLink @click="closeSidebar" to="/performance">Performance</RouterLink>
                    <RouterLink @click="closeSidebar" to="/insight">Insight</RouterLink>
                    <RouterLink @click="closeSidebar" to="/market">Market</RouterLink>
                    <RouterLink @click="closeSidebar" to="/report">Report</RouterLink>
                     <div class="menu-group">
                        <div class="menu-parent" @click="toggleSetting">
                            Setting
                            <span class="arrow">{{ settingOpen ? '▾' : '▸' }}</span>
                        </div>

                        <div v-if="settingOpen" class="submenu">
                            <RouterLink @click="closeSidebar" to="/setting/users">
                                Users
                            </RouterLink>

                            <RouterLink @click="closeSidebar" to="/setting/configuration">
                                Configuration
                            </RouterLink>
                        </div>
                     </div>
                </nav>
            </div>

            <button class="logout-sidebar" @click="handleLogout">Logout</button>
        </aside>

        <!-- Overlay (mobile) -->
        <div v-if="isSidebarOpen" class="overlay" @click="closeSidebar" />

        <!-- Main -->
        <div class="main">
            <!-- Header -->
            <header class="header">
                <button class="menu-btn" @click="toggleSidebar">☰</button>

                <div class="profile">
                    <!-- Theme toggle -->
                    <button class="theme-toggle" @click="toggleTheme">
                        {{ theme === 'dark' ? '🌙' : '☀️' }}
                    </button>

                    <!-- Profile image -->
                    <div class="avatar">?</div>

                    <!-- Username + Logout -->
                    <span class="username">John Doe</span>
                    <!-- <button class="logout-btn" @click="handleLogout">Logout</button> -->
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
    background: #f3f4f6;
}

/* Sidebar */
.sidebar {
    width: 220px;
    background: var(--bg-sidebar);
    color: white;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.logo {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 32px;
}

/* Sidebar menu */
.menu-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.menu {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.menu a {
    padding: 10px 12px;
    color: white;
    text-decoration: none;
    border-radius: 6px;
}

.menu a:hover {
    background: rgba(255, 255, 255, 0.08);
}

.menu a.router-link-active {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    font-weight: 500;
}

/* Main area */
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

/* Header */
.header {
    height: 60px;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
}

/* Menu button */
.menu-btn {
    display: none;
    font-size: 22px;
    background: none;
    border: none;
    cursor: pointer;
}

.menu-group {
    display: flex;
    flex-direction: column;
}

.menu-parent {
    padding: 10px 12px;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.menu-parent:hover {
    background: rgba(255,255,255,0.08);
}

.submenu {
    display: flex;
    flex-direction: column;
    margin-left: 12px;
    gap: 4px;
}

.submenu a {
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 6px;
}

.arrow {
    font-size: 12px;
}

/* Profile (right of sidebar) */
.profile {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #9ca3af;
    color: white;
    font-size: 18px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.username {
    font-weight: 500;
}

.logout-btn {
    padding: 6px 14px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
}

.logout-sidebar {
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.08);
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
}

.logout-sidebar:hover {
    background: rgba(255, 255, 255, 0.15);
}

/* Theme toggle button */
.theme-toggle {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 18px;
}

/* Add smooth transition to layout, sidebar, header, content, and logout button */
.layout,
.sidebar,
.header,
.content,
.logout-sidebar,
.logout-btn,
.avatar,
.menu a {
    transition: background-color 1s, color 1s;
}

/* ---------------- */
/* LIGHT (default) */
/* ---------------- */
.layout.light {
    --bg-page: #f3f4f6;
    --bg-panel: #ffffff;
    --bg-header: #ffffff;
    --bg-sidebar: #1f2937;
    --text-main: #111827;
}

/* ---------------- */
/* DARK */
/* ---------------- */
.layout.dark {
    --bg-page: #0f172a;
    --bg-panel: #020617;
    --bg-header: #020617;
    --bg-sidebar: #020617;
    --text-main: #e5e7eb;
}

/* Apply variables */
.layout {
    background: var(--bg-page);
    color: var(--text-main);
}

.sidebar {
    background: var(--bg-sidebar);
}

.header {
    background: var(--bg-header);
}

.content {
    background: var(--bg-panel);
}

.logout-btn {
    background: var(--bg-panel);
    color: var(--text-main);
}

/* Content with margin & padding */
.content {
    flex: 1;
    padding: 24px;
    margin: 1px;
    background: var(--bg-panel);
    border-radius: 8px;
    overflow: auto;
    color: var(--text-main);
}

/* Overlay */
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9;
}

/* Responsive */
@media (max-width: 768px) {
    .menu-btn {
        display: block;
    }

    .sidebar {
        position: fixed;
        inset: 0 auto 0 0;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        z-index: 10;
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .content {
        margin: 12px;
        padding: 16px;
    }
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isSidebarOpen = ref(false)
const theme = ref('light')

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
    isSidebarOpen.value = false
}

const settingOpen = ref(false)

const toggleSetting = () => {
    settingOpen.value = !settingOpen.value
}

// Updated logout function
const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('rememberMe')
    
    // Optional: Show a logout message
    // You can replace this with a toast notification
    alert('Successfully logged out!')
    
    // Redirect to login page
    router.push('/login')
}

/* 🌗 Theme */
const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
}

onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) theme.value = savedTheme
})
</script>