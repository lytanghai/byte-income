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
                    <RouterLink @click="closeSidebar" to="/insight">
                        <span class="menu-text">Insight</span>
                    </RouterLink>
                    <!-- <RouterLink @click="closeSidebar" to="/market" class="notification-link">
                        <span class="menu-text">Market</span>
                        <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
                    </RouterLink> -->
                    <RouterLink @click="closeSidebar" to="/report">
                        <span class="menu-text">Report</span>
                    </RouterLink>
                    <RouterLink @click="closeSidebar" to="/calculator">
                        <span class="menu-text">Calculator</span>
                    </RouterLink>
                    
                    <div class="menu-group">
                        <div class="menu-parent" @click="toggleSetting">
                            <span class="menu-parent-content">
                                <span class="menu-text">Setting</span>
                            </span>
                            <span class="arrow">{{ settingOpen ? '▾' : '▸' }}</span>
                        </div>

                        <div v-if="settingOpen" class="submenu">
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
            <!-- Header -->
            <header class="header">
                <div class="header-left">
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
                    <!-- Notification Bell (Mobile) -->
                    <button class="notification-bell mobile-only" @click="goToMarket">
                        <span class="bell-icon">🔔</span>
                        <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount }}</span>
                    </button>

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
                            <span class="session-icon">🇬🇧</span>
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
const settingOpen = ref(false)
const username = ref('')
const isMobileProfileOpen = ref(false)

// Datetime state
const currentDateTime = ref(new Date())
let datetimeInterval = null

// Quote state
const quotes = [
    "Follow the plan, follow the market"
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
    
    // Check if currently in session
    if (currentUTC >= start && currentUTC < end) {
        const remainingMinutes = (end - currentUTC) * 60
        return formatCountdown(remainingMinutes)
    } 
    // Check if before session starts today
    else if (currentUTC < start) {
        const waitMinutes = (start - currentUTC) * 60
        return `Starts in ${formatCountdown(waitMinutes)}`
    } 
    // After session ends, wait until next day
    else {
        const nextStart = start + 24
        const waitMinutes = (nextStart - currentUTC) * 60
        return `Starts in ${formatCountdown(waitMinutes)}`
    }
}

// Change quote every 10 seconds
const changeQuote = () => {
    isQuoteChanging.value = true
    
    // Get random quote different from current
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

// Compute current time in 24-hour format
const currentTime = computed(() => {
    return currentDateTime.value.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    })
})

// Get time icon based on hour
const currentTimeIcon = computed(() => {
    const hour = currentDateTime.value.getHours()
    
    if (hour >= 5 && hour < 12) {
        return '🌅' // Morning
    } else if (hour >= 12 && hour < 17) {
        return '☀️' // Afternoon
    } else if (hour >= 17 && hour < 20) {
        return '🌆' // Evening
    } else {
        return '🌙' // Night
    }
})

// Check if session is active
const isSessionActive = (session) => {
    const now = currentDateTime.value
    const utcHour = now.getUTCHours()
    const utcMinute = now.getUTCMinutes()
    const currentUTC = utcHour + utcMinute / 60
    
    switch(session) {
        case 'asia':
            return currentUTC >= 0 && currentUTC < 9
        case 'london':
            return currentUTC >= 8 && currentUTC < 17
        case 'newyork':
            return currentUTC >= 13 && currentUTC < 22
        default:
            return false
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

const goToMarket = () => {
    router.push('/market')
    isMobileProfileOpen.value = false
    isSidebarOpen.value = false
}

const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('userData')
    localStorage.removeItem('notification_cache')
    localStorage.removeItem('notification_timestamp')
    
    // Stop polling
    if (pollingInterval) {
        clearInterval(pollingInterval)
    }
    
    // Stop datetime interval
    if (datetimeInterval) {
        clearInterval(datetimeInterval)
    }
    
    // Stop quote interval
    if (quoteInterval) {
        clearInterval(quoteInterval)
    }
    
    // Redirect to login page
    router.push('/login')
}

// ============== NOTIFICATION POLLING ==============
const NOTIFICATION_API_URL = (import.meta.env.VITE_API__NOTIFICATION_BASE_URL || 'http://localhost:8081') + '/notification/fetch-unread'
const NOTIFICATION_CACHE_KEY = 'notification_cache'
const NOTIFICATION_TIMESTAMP_KEY = 'notification_timestamp'

// Load cached notifications
const loadNotificationsFromCache = () => {
    try {
        const cached = localStorage.getItem(NOTIFICATION_CACHE_KEY)
        
        if (cached) {
            const data = JSON.parse(cached)
            notifications.value = data
            // Count unread notifications
            const unread = data.filter(n => !n.has_read).length
            unreadCount.value = unread
            console.log('✅ Loaded notifications from cache:', data.length, 'unread:', unread)
            return true
        }
    } catch (err) {
        console.error('Failed to load notifications from cache:', err)
    }
    return false
}

// Save notifications to cache
const saveNotificationsToCache = (data) => {
    try {
        localStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(data))
        localStorage.setItem(NOTIFICATION_TIMESTAMP_KEY, new Date().toISOString())
        
        // Update unread count
        const unread = data.filter(n => !n.has_read).length
        unreadCount.value = unread
    } catch (err) {
        console.error('Failed to save notifications to cache:', err)
    }
}

// Update unread count from cache (called when storage changes)
const updateUnreadCountFromCache = () => {
    try {
        const cached = localStorage.getItem(NOTIFICATION_CACHE_KEY)
        if (cached) {
            const data = JSON.parse(cached)
            const unread = data.filter(n => !n.has_read).length
            unreadCount.value = unread
            notifications.value = data
            console.log('🔄 Updated unread count from cache:', unread)
        }
    } catch (err) {
        console.error('Failed to update from cache:', err)
    }
}

// Fetch unread notifications
const fetchUnreadNotifications = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
        const response = await fetch(NOTIFICATION_API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        const result = await response.json()

        if (result.code === '200' && result.data) {
            const newNotifications = result.data
            const newUnreadCount = newNotifications.filter(n => !n.has_read).length
            
            // Check if count changed
            if (newUnreadCount !== unreadCount.value) {
                console.log(`📬 Notification count changed: ${unreadCount.value} → ${newUnreadCount}`)
                
                // Play sound only if there are new unread notifications
                if (newUnreadCount > unreadCount.value && newUnreadCount > 0) {
                    playNotificationSound()
                }
            }
            
            notifications.value = newNotifications
            unreadCount.value = newUnreadCount
            saveNotificationsToCache(newNotifications)
        }
    } catch (err) {
        console.error('Failed to fetch notifications:', err)
    }
}

// Play notification sound (optional)
const playNotificationSound = () => {
    try {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.1
        
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
    } catch (err) {
        console.log('Audio not supported')
    }
}

// Start polling every 30 seconds
const startPolling = () => {
    // Load from cache first
    // loadNotificationsFromCache()
    
    // Fetch immediately
    // fetchUnreadNotifications()
    
    // Then poll every 30 seconds
    // pollingInterval = setInterval(fetchUnreadNotifications, 30000) // 30 seconds
}

/* Theme toggle */
const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
}

// Watch for route changes to update unread count when navigating to market
watch(() => route.path, (newPath) => {
    if (newPath === '/market') {
        // When navigating to market, we'll let the market component handle marking as read
        // But we should update our local cache when we return
        setTimeout(updateUnreadCountFromCache, 500)
    }
})

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

    // Start datetime interval
    datetimeInterval = setInterval(() => {
        currentDateTime.value = new Date()
    }, 1000)

    // Start quote interval (10 seconds)
    quoteInterval = setInterval(() => {
        changeQuote()
    }, 10000)

    // Start notification polling
    startPolling()

    // Listen for storage events (for cross-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === NOTIFICATION_CACHE_KEY) {
            updateUnreadCountFromCache()
        }
    })

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

onUnmounted(() => {
    // Clean up datetime interval
    if (datetimeInterval) {
        clearInterval(datetimeInterval)
    }
    
    // Clean up quote interval
    if (quoteInterval) {
        clearInterval(quoteInterval)
    }
    
    // Clean up polling interval
    if (pollingInterval) {
        clearInterval(pollingInterval)
    }
    
    // Remove storage listener
    window.removeEventListener('storage', updateUnreadCountFromCache)
})
</script>