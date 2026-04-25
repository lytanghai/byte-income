<template>
    <div class="layout" :class="theme">
        <!-- Sidebar -->
        <aside class="sidebar" :class="{ open: isSidebarOpen }">
            <div class="sidebar-header">
                <h2 class="logo">DataBae</h2>
                <button class="close-sidebar mobile-only" @click="closeSidebar">✕</button>
            </div>

            <!-- Wrap menu in container -->
            <div class="menu-container">
                <nav class="menu">
                    <RouterLink @click="closeSidebar" to="/overview">
                        <span class="menu-text">Overview</span>
                    </RouterLink>
                    <RouterLink @click="closeSidebar" to="/transaction">
                        <span class="menu-text">Transaction</span>
                    </RouterLink>
                    <RouterLink @click="closeSidebar" to="/performance">
                        <span class="menu-text">Performance</span>
                    </RouterLink>
                
                    <RouterLink @click="closeSidebar" to="/report">
                        <span class="menu-text">Report</span>
                    </RouterLink>
                    <RouterLink @click="closeSidebar" to="/calculator">
                        <span class="menu-text">Calculator</span>
                    </RouterLink>

                    <!-- ANALYSIS MENU - Fixed -->
                    <div class="menu-group">
                        <div class="menu-parent" @click="toggleAnalysis">
                            <span class="menu-parent-content">
                                <span class="menu-text">Analysis</span>
                            </span>
                            <span class="arrow">{{ isAnalysisOpen ? '▾' : '▸' }}</span>
                        </div>
                        <div v-if="isAnalysisOpen" class="submenu">
                            <RouterLink @click="closeSidebar" to="/tradingview">
                                <span class="menu-text">Chart</span>
                            </RouterLink>
                            <RouterLink @click="closeSidebar" to="/insight">
                                <span class="menu-text">Insight</span>
                            </RouterLink>
                            <RouterLink @click="closeSidebar" to="/polymarket">
                                <span class="menu-text">Polymarket</span>
                            </RouterLink>
                        </div>
                    </div>
                    
                    <!-- SETTING MENU - Fixed -->
                    <div class="menu-group">
                        <div class="menu-parent" @click="toggleSetting">
                            <span class="menu-parent-content">
                                <span class="menu-text">Setting</span>
                            </span>
                            <span class="arrow">{{ isSettingOpen ? '▾' : '▸' }}</span>
                        </div>

                        <div v-if="isSettingOpen" class="submenu">
                            <RouterLink @click="closeSidebar" to="/setting/users">
                                <span class="menu-text">Users</span>
                            </RouterLink>

                            <RouterLink @click="closeSidebar" to="/setting/configuration">
                                <span class="menu-text">Configuration</span>
                            </RouterLink>
                             <RouterLink @click="closeSidebar" to="/cache">
                                <span class="menu-text">Cache</span>
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
            <!-- Header with Hamburger Menu -->
            <header class="header">
                <div class="header-left">
                    <!-- ✅ HAMBURGER MENU BUTTON - RESTORED -->
                    <button class="menu-btn" @click="toggleSidebar">☰</button>
                    <h2 class="page-title mobile-only">{{ currentPageTitle }}</h2>
                </div>

                <!-- Quote Display - Center -->
                <div class="header-center">
                    <div class="quote-container" :class="{ 'quote-fade': isQuoteChanging }">
                        <span class="quote-icon">💡</span>
                        <span class="quote-text">{{ currentQuote }}</span>
                    </div>
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
                <!-- Datetime and Trading Sessions Widget -->
                <div class="datetime-session-widget">
                    <div class="datetime-card">
                        <div class="datetime-icon">{{ currentTimeIcon }}</div>
                        <div class="datetime-info">
                            <div class="date">{{ currentDate }}</div>
                            <div class="time">{{ currentTime }}</div>
                        </div>
                    </div>
                    <div class="sessions-card">
                        <div class="session" :class="{ active: isSessionActive('asia') }">
                            <span class="session-icon">🌏</span>
                            <span class="session-name">Asia</span>
                            <span class="session-status">{{ getSessionCountdown('asia') }}</span>
                        </div>
                        <div class="session" :class="{ active: isSessionActive('london') }">
                            <span class="session-icon">UK</span>
                            <span class="session-name">London</span>
                            <span class="session-status">{{ getSessionCountdown('london') }}</span>
                        </div>
                        <div class="session" :class="{ active: isSessionActive('newyork') }">
                            <span class="session-icon">🇺🇸</span>
                            <span class="session-name">New York</span>
                            <span class="session-status">{{ getSessionCountdown('newyork') }}</span>
                        </div>
                    </div>
                </div>
                
                <router-view />
            </main>
        </div>
    </div>
</template>

<style scoped>
  @import '../assets/styles/dashboard.css';
</style>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isSidebarOpen = ref(false)
const theme = ref('dark')
// ✅ FIXED: Separate state variables for Analysis and Setting menus
const isAnalysisOpen = ref(false)  // For Analysis menu
const isSettingOpen = ref(false)    // For Setting menu
const username = ref('')
const isMobileProfileOpen = ref(false)

// Datetime state
const currentDateTime = ref(new Date())
let datetimeInterval = null

// Quote state
const quotes = [
    "Buy at support, Sell at resistance",
    "0.1 for investment!",
    "Cut losses quickly, let winners run",
    "Never risk more than 1-2% per trade",
    "Protect your capital, it's all you have",
    "The best trade is sometimes no trade at all",
    "Plan your trade, trade your plan",
    "Don't let emotions drive your decisions",
    "Greed and fear are the trader's worst enemies",
    "Patience is a trader's superpower",
    "The market stays rational longer than you can stay solvent",
    "Gold is the currency of last resort",
    "When in doubt, zoom out",
    "The trend is your friend",
    "Buy the rumor, sell the news",
    "Be fearful when others are greedy, greedy when others are fearful",
    "Price is what you pay, value is what you get",
    "Never lose money, rule No.1",
    "Trendlines are meant to be broken",
    "Support broken becomes resistance",
    "The bigger the base, the higher in space",
    "Rome wasn't built in a day, neither is wealth",
    "Time in the market beats timing the market",
    "Don't catch a falling knife",
    "Bull markets climb a wall of worry",
    "Every day is a new opportunity",
    "Small consistent profits > big occasional losses",
    "Keep it simple, stupid (KISS)",
    "The first loss is the best loss",
    "Compound interest is the 8th wonder of the world",
    "Investing is a marathon, not a sprint",
    "Diversification is the only free lunch",
    "Losses are tuition for market education",
    "Successful trading is 10% strategy, 90% psychology",
    "The goal is not to be right, but to make money"
]
const currentQuote = ref(quotes[0])
const isQuoteChanging = ref(false)
let quoteInterval = null

// Helper function to format countdown
const formatCountdown = (totalMinutes) => {
    if (totalMinutes <= 0) return 'Closed'
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.floor(totalMinutes % 60)
    
    if (hours > 0) {
        return `${hours}h ${minutes}m left`
    } else {
        return `${minutes}m left`
    }
}

// Get countdown for each session
const getSessionCountdown = (session) => {
    const now = currentDateTime.value
    const utcHour = now.getUTCHours()
    const utcMinute = now.getUTCMinutes()
    const currentUTC = utcHour + utcMinute / 60
    
    let start, end
    
    switch(session) {
        case 'asia':
            start = 0
            end = 9
            break
        case 'london':
            start = 8
            end = 17
            break
        case 'newyork':
            start = 13
            end = 22
            break
        default:
            return 'Closed'
    }
    
    if (currentUTC >= start && currentUTC < end) {
        const remainingMinutes = (end - currentUTC) * 60
        return formatCountdown(remainingMinutes)
    } 
    else if (currentUTC < start) {
        const waitMinutes = (start - currentUTC) * 60
        return `Starts in ${formatCountdown(waitMinutes)}`
    } 
    else {
        const nextStart = start + 24
        const waitMinutes = (nextStart - currentUTC) * 60
        return `Starts in ${formatCountdown(waitMinutes)}`
    }
}

// Change quote every 10 seconds
const changeQuote = () => {
    isQuoteChanging.value = true
    
    let newQuote = currentQuote.value
    while (newQuote === currentQuote.value && quotes.length > 1) {
        const randomIndex = Math.floor(Math.random() * quotes.length)
        newQuote = quotes[randomIndex]
    }
    
    setTimeout(() => {
        currentQuote.value = newQuote
        setTimeout(() => {
            isQuoteChanging.value = false
        }, 500)
    }, 250)
}

// Compute current date
const currentDate = computed(() => {
    return currentDateTime.value.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })
})

// Compute current time
const currentTime = computed(() => {
    return currentDateTime.value.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    })
})

// Get time icon
const currentTimeIcon = computed(() => {
    const hour = currentDateTime.value.getHours()
    
    if (hour >= 5 && hour < 12) return '☀️'
    else if (hour >= 12 && hour < 17) return '🔥'
    else if (hour >= 17 && hour < 20) return '🌆'
    else return '🌙'
})

// Check if session is active
const isSessionActive = (session) => {
    const now = currentDateTime.value
    const utcHour = now.getUTCHours()
    const utcMinute = now.getUTCMinutes()
    const currentUTC = utcHour + utcMinute / 60
    
    switch(session) {
        case 'asia': return currentUTC >= 0 && currentUTC < 9
        case 'london': return currentUTC >= 8 && currentUTC < 17
        case 'newyork': return currentUTC >= 13 && currentUTC < 22
        default: return false
    }
}

// Compute current page title for mobile
const currentPageTitle = computed(() => {
    const path = route.path
    if (path.includes('overview')) return 'Overview'
    if (path.includes('performance')) return 'Performance'
    if (path.includes('insight')) return 'Insight'
    if (path.includes('market')) return 'Market'
    if (path.includes('report')) return 'Report'
    if (path.includes('setting')) return 'Settings'
    if (path.includes('tradingview')) return 'Chart'
    return 'Dashboard'
})

// ✅ Hamburger menu functions (restored)
const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
    if (isSidebarOpen.value) {
        isMobileProfileOpen.value = false
    }
}

const closeSidebar = () => {
    isSidebarOpen.value = false
}

// ✅ Separate toggle functions for menus
const toggleAnalysis = () => {
    isAnalysisOpen.value = !isAnalysisOpen.value
}

const toggleSetting = () => {
    isSettingOpen.value = !isSettingOpen.value
}

const toggleMobileProfile = () => {
    isMobileProfileOpen.value = !isMobileProfileOpen.value
    if (isMobileProfileOpen.value) {
        isSidebarOpen.value = false
    }
}

const goToMarket = () => {
    router.push('/market')
    isMobileProfileOpen.value = false
    isSidebarOpen.value = false
}

const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('userData')
    localStorage.removeItem('notification_cache')
    localStorage.removeItem('notification_timestamp')
    
    if (datetimeInterval) clearInterval(datetimeInterval)
    if (quoteInterval) clearInterval(quoteInterval)
    
    router.push('/login')
}

// Theme toggle
const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
}

// Watch for route changes
watch(() => route.path, () => {
    if (window.innerWidth <= 768) {
        isSidebarOpen.value = false
        isMobileProfileOpen.value = false
    }
})

// Lifecycle hooks
onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) theme.value = savedTheme

    const userData = localStorage.getItem('userData')
    if (userData) {
        try {
            const parsed = JSON.parse(userData)
            username.value = parsed.username || ''
        } catch (e) {
            console.error('Error parsing userData:', e)
        }
    }

    datetimeInterval = setInterval(() => {
        currentDateTime.value = new Date()
    }, 1000)

    quoteInterval = setInterval(() => {
        changeQuote()
    }, 10000)

    // Close sidebar on resize if screen becomes desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            isSidebarOpen.value = false
            isMobileProfileOpen.value = false
        }
    })
})

onUnmounted(() => {
    if (datetimeInterval) clearInterval(datetimeInterval)
    if (quoteInterval) clearInterval(quoteInterval)
})
</script>