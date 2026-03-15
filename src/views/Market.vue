<template>
  <div class="market-page">
    <!-- Header -->
    <div class="page-header">
      <h1>Market</h1>
      <p class="subtitle">Real-time Gold and DXY prices</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'chart' }"
        @click="activeTab = 'chart'"
      >
        Chart
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'telegram' }"
        @click="switchToTelegramTab"
      >
        <span class="tab-icon">📱</span>
        Notification
        <span v-if="unreadCount > 0" class="tab-badge">{{ unreadCount }}</span>
      </button>
    </div>

    <!-- Chart Tab (Gold + DXY) -->
    <div v-show="activeTab === 'chart'" class="chart-tab">
      <!-- Connection Status -->
      <div class="connection-status" :class="connectionState">
        <span class="status-indicator"></span>
        <span class="status-text">{{ connectionMessage }}</span>
        <span class="next-update">Next update in {{ countdown }}s</span>
        <button @click="refreshAllData" class="btn-refresh" :disabled="loading || dxyLoading">
          <span class="refresh-icon" :class="{ 'spin': loading || dxyLoading }">↻</span>
          Refresh
        </button>
      </div>

      <!-- Two-Column Layout for Charts -->
      <div class="charts-grid">
        <!-- Gold Card -->
        <div class="price-card gold-card" v-if="goldData">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">🥇</span>
              <h2>{{ goldData.name }}</h2>
              <span class="card-symbol">{{ goldData.symbol }}</span>
            </div>
            <div class="last-updated">
              {{ formatLastUpdated(goldData.updatedAtReadable, goldData.updatedAt) }}
            </div>
          </div>

          <div class="price-container">
            <div class="price-main">
              <span class="price-label">Spot Price</span>
              <span class="price-value">{{ formatPrice(goldData.price) }}</span>
              <span class="price-currency">USD/oz</span>
            </div>

            <!-- 30-Minute Price Change -->
            <div class="price-change" :class="goldTrend">
              <span class="trend-icon">{{ goldTrend === 'up' ? '▲' : goldTrend === 'down' ? '▼' : '◆' }}</span>
              <div class="trend-details">
                <span class="trend-text">{{ goldTrend === 'up' ? 'Rising' : goldTrend === 'down' ? 'Falling' : 'Stable' }}</span>
                <span class="trend-change" :class="getChangeClass(goldStats.change)">
                  {{ formatChange(goldStats.change) }} ({{ formatChangePercent(goldStats.changePercent) }})
                </span>
              </div>
            </div>
          </div>

          <!-- Gold Price Chart -->
          <div class="price-chart">
            <div class="chart-header">
              <h3>Gold (Last 30 Minutes)</h3>
              <span class="chart-interval">30 points • 1 min intervals</span>
            </div>
            <div class="chart-container">
              <div class="chart-y-axis">
                <span>{{ formatPrice(goldStats.max) }}</span>
                <span>{{ formatPrice(goldStats.avg) }}</span>
                <span>{{ formatPrice(goldStats.min) }}</span>
              </div>
              <div class="chart-bars">
                <div v-for="(price, index) in goldHistory" :key="index" class="chart-bar-wrapper">
                  <div 
                    class="chart-bar" 
                    :style="{ height: getGoldBarHeight(price) + '%' }" 
                    :class="getGoldBarClass(price)"
                  >
                    <span class="bar-tooltip">{{ formatPrice(price) }}<br>{{ getGoldBarTime(index) }}</span>
                  </div>
                  <span class="bar-label" v-if="index % 5 === 0">{{ index }}m</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Gold Stats -->
          <div class="price-stats">
            <div class="stat-item">
              <span class="stat-label">30m High</span>
              <span class="stat-value">{{ formatPrice(goldStats.max) }}</span>
              <span class="stat-time">{{ goldHighTime }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">30m Low</span>
              <span class="stat-value">{{ formatPrice(goldStats.min) }}</span>
              <span class="stat-time">{{ goldLowTime }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Change</span>
              <span class="stat-value" :class="getChangeClass(goldStats.change)">{{ formatChange(goldStats.change) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Change %</span>
              <span class="stat-value" :class="getChangeClass(goldStats.changePercent)">{{ formatChangePercent(goldStats.changePercent) }}</span>
            </div>
          </div>
        </div>

        <!-- DXY Card -->
        <div class="price-card dxy-card" v-if="dxyData">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">💵</span>
              <h2>US Dollar Index</h2>
              <span class="card-symbol">DXY</span>
            </div>
            <div class="last-updated">
              {{ formatDxyTime(dxyData.t) }}
            </div>
          </div>

          <div class="price-container">
            <div class="price-main">
              <span class="price-label">Index Value</span>
              <span class="price-value">{{ formatDxyPrice(dxyData.ld) }}</span>
              <span class="price-currency">DXY</span>
            </div>

            <!-- DXY Price Change -->
            <div class="price-change" :class="dxyTrend">
              <span class="trend-icon">{{ dxyTrend === 'up' ? '▲' : dxyTrend === 'down' ? '▼' : '◆' }}</span>
              <div class="trend-details">
                <span class="trend-text">{{ dxyTrend === 'up' ? 'Rising' : dxyTrend === 'down' ? 'Falling' : 'Stable' }}</span>
                <span class="trend-change" :class="getChangeClass(dxyStats.change)">
                  {{ formatDxyChange(dxyStats.change) }} ({{ formatChangePercent(dxyStats.changePercent) }})
                </span>
              </div>
            </div>
          </div>

          <!-- DXY Price Chart -->
          <div class="price-chart">
            <div class="chart-header">
              <h3>DXY (Last 30 Minutes)</h3>
              <span class="chart-interval">30 points • 1 min intervals</span>
            </div>
            <div class="chart-container">
              <div class="chart-y-axis">
                <span>{{ formatDxyPrice(dxyStats.max) }}</span>
                <span>{{ formatDxyPrice(dxyStats.avg) }}</span>
                <span>{{ formatDxyPrice(dxyStats.min) }}</span>
              </div>
              <div class="chart-bars">
                <div v-for="(price, index) in dxyHistory" :key="index" class="chart-bar-wrapper">
                  <div 
                    class="chart-bar" 
                    :style="{ height: getDxyBarHeight(price) + '%' }" 
                    :class="getDxyBarClass(price)"
                  >
                    <span class="bar-tooltip">{{ formatDxyPrice(price) }}<br>{{ getDxyBarTime(index) }}</span>
                  </div>
                  <span class="bar-label" v-if="index % 5 === 0">{{ index }}m</span>
                </div>
              </div>
            </div>
          </div>

          <!-- DXY Stats -->
          <div class="price-stats">
            <div class="stat-item">
              <span class="stat-label">30m High</span>
              <span class="stat-value">{{ formatDxyPrice(dxyStats.max) }}</span>
              <span class="stat-time">{{ dxyHighTime }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">30m Low</span>
              <span class="stat-value">{{ formatDxyPrice(dxyStats.min) }}</span>
              <span class="stat-time">{{ dxyLowTime }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Change</span>
              <span class="stat-value" :class="getChangeClass(dxyStats.change)">{{ formatDxyChange(dxyStats.change) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Change %</span>
              <span class="stat-value" :class="getChangeClass(dxyStats.changePercent)">{{ formatChangePercent(dxyStats.changePercent) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading States -->
      <div v-if="(!goldData || !dxyData) && (loading || dxyLoading)" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching market data...</p>
      </div>

      <!-- Error States -->
      <div v-else-if="error || dxyError" class="error-state">
        <p class="error-message">{{ error || dxyError }}</p>
        <button @click="refreshAllData" class="btn-retry">Retry</button>
      </div>
    </div>

    <!-- Telegram VPS Tab -->
    <div v-show="activeTab === 'telegram'" class="telegram-tab">
      <!-- VPS Connection Status -->
      <div class="vps-status" :class="vpsConnectionState">
        <span class="status-indicator"></span>
        <span class="status-text">{{ vpsConnectionMessage }}</span>
        <span class="last-heartbeat">Last heartbeat: {{ lastHeartbeat }}</span>
      </div>

      <!-- VPS Controls -->
      <div class="vps-controls">
        <button class="btn-clear" @click="clearAllAlerts" v-if="alerts.length > 0">
          <span class="btn-icon">🗑️</span>
          Clear All
        </button>
        <button class="btn-refresh" @click="fetchNotifications" :disabled="notificationsLoading">
          <span class="refresh-icon" :class="{ 'spin': notificationsLoading }">↻</span>
          Refresh
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="vps-stats">
        <div class="stat-card">
          <span class="stat-label">Total Alerts</span>
          <span class="stat-value">{{ alerts.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Unread</span>
          <span class="stat-value">{{ unreadAlerts.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">High Severity</span>
          <span class="stat-value">{{ highSeverityAlerts }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Last 24h</span>
          <span class="stat-value">{{ last24hAlerts }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">API Unread</span>
          <span class="stat-value">{{ unreadCount }}</span>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="alert-filters">
        <select v-model="alertFilter.severity" class="filter-select">
          <option value="">All Severities</option>
          <option value="danger">Danger</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        
        <select v-model="alertFilter.type" class="filter-select">
          <option value="">All Types</option>
          <option value="VOLATILITY">Volatility</option>
          <option value="PRICE_SPIKE">Price Spike</option>
          <option value="NEWS">News</option>
        </select>

        <input 
          v-model="alertFilter.symbol" 
          placeholder="Filter by symbol..."
          class="filter-input"
        />
      </div>

      <!-- Loading State -->
      <div v-if="notificationsLoading && notifications.length === 0" class="loading-state small">
        <div class="spinner-small"></div>
        <p>Loading notifications...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="notificationsError" class="error-state small">
        <p class="error-message">{{ notificationsError }}</p>
        <button @click="fetchNotifications(true)" class="btn-retry">Retry</button>
      </div>

      <!-- Notifications List (from API) -->
      <div v-else class="notifications-section">
        <div class="section-header">
          <h3>API Notifications</h3>
          <span class="last-updated">Last update: {{ formatLastNotificationTime }}</span>
        </div>

        <div v-if="notifications.length === 0" class="no-notifications">
          <span class="no-notifications-icon">📭</span>
          <p>No notifications from API</p>
        </div>

        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-card"
          :class="{ 'unread': !notification.has_read }"
          @click="markAsRead(notification)"
        >
          <div class="notification-icon">
            <span v-if="notification.title.includes('Volatility')">🌪️</span>
            <span v-else-if="notification.title.includes('Price')">📈</span>
            <span v-else>📢</span>
          </div>

          <div class="notification-content">
            <div class="notification-header">
              <span class="notification-title">{{ notification.title }}</span>
              <span class="notification-time">{{ formatNotificationTime(notification.sent_at) }}</span>
            </div>
            <p class="notification-message">{{ notification.value }}</p>
            <div v-if="notification.extra" class="notification-extra">
              {{ notification.extra }}
            </div>
          </div>

          <div v-if="!notification.has_read" class="unread-indicator"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useNotification } from '../composables/useNotification'

const notification = useNotification()

// ============== CONFIG ==============
const ITICK_TOKEN = import.meta.env.VITE_ITICK_TOKEN || 'your_token_here'
const NOTIFICATION_API_URL = (import.meta.env.VITE_API__NOTIFICATION_BASE_URL || 'http://localhost:8081') + '/notification/fetch-unread'
const UPDATE_STATUS_API_URL = (import.meta.env.VITE_API__NOTIFICATION_BASE_URL || 'http://localhost:8081') + '/notification/update-status'

// ============== TAB STATE ==============
const activeTab = ref('chart')

// ============== NOTIFICATION STATE ==============
const notifications = ref([])
const notificationsLoading = ref(false)
const notificationsError = ref(null)
const vpsConnectionState = ref('connected')
const vpsConnectionMessage = ref('Connected')
const lastNotificationFetch = ref(null)
const processedMessageIds = ref(new Set()) // Track already processed message IDs
let notificationPollingInterval = null

// ============== GOLD API ==============
const GOLD_API_URL = 'https://api.gold-api.com/price/XAU'

// Gold state
const goldData = ref(null)
const loading = ref(false)
const error = ref(null)
const connectionState = ref('connected')
const connectionMessage = ref('Connected')
const countdown = ref(60)

// Gold history
const goldHistory = ref([])
const goldTimestamps = ref([])

// ============== DXY API ==============
const DXY_API_URL = 'https://api.itick.org/indices/tick?region=GB&code=DXY'

// DXY state
const dxyData = ref(null)
const dxyLoading = ref(false)
const dxyError = ref(null)

// DXY history
const dxyHistory = ref([])
const dxyTimestamps = ref([])

let goldTimerInterval = null
let countdownInterval = null

// ============== VPS/TELEGRAM STATE ==============
const lastHeartbeat = ref('Just now')

// Alerts from VPS
const alerts = ref([])
const alertPage = ref(1)

// Alert filters
const alertFilter = reactive({
  severity: '',
  type: '',
  symbol: ''
})

// ============== NOTIFICATION FUNCTIONS ==============
const fetchNotifications = async (force = false) => {
  notificationsLoading.value = true
  notificationsError.value = null

  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No authentication token')
    }

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
      
      // Filter out already processed messages
      const uniqueNotifications = newNotifications.filter(n => !processedMessageIds.value.has(n.id))
      
      if (uniqueNotifications.length > 0) {
        notifications.value = [...uniqueNotifications, ...notifications.value]
        
        // Add new IDs to processed set
        uniqueNotifications.forEach(n => processedMessageIds.value.add(n.id))
      }
      
      lastNotificationFetch.value = new Date()

      // Update dashboard badge via localStorage
      localStorage.setItem('notification_cache', JSON.stringify(notifications.value))
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'))

      vpsConnectionState.value = 'connected'
      vpsConnectionMessage.value = 'Connected'
    } else {
      throw new Error(result.message || 'Failed to fetch notifications')
    }
  } catch (err) {
    notificationsError.value = err.message
    vpsConnectionState.value = 'disconnected'
    vpsConnectionMessage.value = 'Disconnected'
    console.error('Failed to fetch notifications:', err)
  } finally {
    notificationsLoading.value = false
  }
}

const updateNotificationStatus = async (messageIds) => {
  if (!messageIds || messageIds.length === 0) return

  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(UPDATE_STATUS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message_ids: messageIds
      })
    })

    const result = await response.json()

    if (result.code === '200') {
      console.log('✅ Notification status updated successfully')
      
      // Remove from processed set
      messageIds.forEach(id => processedMessageIds.value.delete(id))
      
      // Update localStorage
      localStorage.setItem('notification_cache', JSON.stringify(notifications.value))
      
      return true
    } else {
      throw new Error(result.message || 'Failed to update notification status')
    }
  } catch (err) {
    console.error('Failed to update notification status:', err)
    notification.error('Failed to update notification status')
    return false
  }
}

const markAsRead = async (notification) => {
  if (!notification.has_read) {
    notification.has_read = true
    
    // Call API to update status
    await updateNotificationStatus([notification.id])
  }
}

const markAllAsRead = async () => {
  const unreadIds = notifications.value
    .filter(n => !n.has_read)
    .map(n => n.id)
  
  if (unreadIds.length === 0) return
  
  // Mark all as read locally
  notifications.value.forEach(n => n.has_read = true)
  
  // Call API to update status
  const success = await updateNotificationStatus(unreadIds)
  
  if (success) {
    notification.success('All notifications marked as read')
  }
}

const switchToTelegramTab = async () => {
  // Switch tab first
  activeTab.value = 'telegram'
  
  // Get unread message IDs from current notifications
  const unreadIds = notifications.value
    .filter(n => !n.has_read)
    .map(n => n.id)
  
  if (unreadIds.length > 0) {
    console.log('📬 Updating status for unread messages:', unreadIds)
    
    // Call API to update status
    const success = await updateNotificationStatus(unreadIds)
    
    if (success) {
      // Mark as read locally
      notifications.value.forEach(n => n.has_read = true)
      
      // Update localStorage
      localStorage.setItem('notification_cache', JSON.stringify(notifications.value))
      window.dispatchEvent(new Event('storage'))
    }
  }
}

// ============== NOTIFICATION COMPUTED ==============
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.has_read).length
})

const formatLastNotificationTime = computed(() => {
  if (!lastNotificationFetch.value) return 'Never'
  const diff = Date.now() - lastNotificationFetch.value
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
})

// ============== GOLD FUNCTIONS ==============
const fetchGoldPrice = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = null

  try {
    const response = await fetch(GOLD_API_URL)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Store previous price with timestamp
    if (goldData.value) {
      goldHistory.value.push(goldData.value.price)
      goldTimestamps.value.push(new Date())
      
      // Keep only last 30 data points
      if (goldHistory.value.length > 30) {
        goldHistory.value.shift()
        goldTimestamps.value.shift()
      }
    }
    
    goldData.value = data
    connectionState.value = 'connected'
    connectionMessage.value = 'Connected'
    
  } catch (err) {
    error.value = err.message
    connectionState.value = 'disconnected'
    connectionMessage.value = 'Disconnected'
    notification.error(`Failed to fetch gold: ${err.message}`)
  } finally {
    loading.value = false
  }
}

// ============== DXY FUNCTIONS ==============
const fetchDXYPrice = async () => {
  if (dxyLoading.value) return
  
  dxyLoading.value = true
  dxyError.value = null

  try {
    const response = await fetch(DXY_API_URL, {
      headers: {
        'accept': 'application/json',
        'token': ITICK_TOKEN
      }
    })
    
    if (response.status === 401) {
      throw new Error('Invalid API token. Please check your iTick token in .env file.')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.code === 0 && result.data) {
      const data = result.data
      
      // Store previous price with timestamp
      if (dxyData.value) {
        dxyHistory.value.push(dxyData.value.ld)
        dxyTimestamps.value.push(new Date(data.t))
        
        // Keep only last 30 data points
        if (dxyHistory.value.length > 30) {
          dxyHistory.value.shift()
          dxyTimestamps.value.shift()
        }
      }
      
      dxyData.value = data
      connectionState.value = 'connected'
      connectionMessage.value = 'Connected'
      
    } else {
      throw new Error(result.msg || 'Failed to fetch DXY data')
    }
    
  } catch (err) {
    dxyError.value = err.message
    connectionState.value = 'disconnected'
    connectionMessage.value = 'Disconnected'
    notification.error(`Failed to fetch DXY: ${err.message}`)
  } finally {
    dxyLoading.value = false
  }
}

const refreshAllData = () => {
  fetchGoldPrice()
  fetchDXYPrice()
  countdown.value = 60
}

// ============== GOLD COMPUTED ==============
const goldStats = computed(() => {
  const prices = [...goldHistory.value, goldData.value?.price].filter(p => p)
  if (prices.length === 0) {
    return { 
      max: goldData.value?.price || 0, 
      min: goldData.value?.price || 0, 
      avg: goldData.value?.price || 0, 
      change: 0, 
      changePercent: 0 
    }
  }
  
  const max = Math.max(...prices)
  const min = Math.min(...prices)
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length
  const change = prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0
  const changePercent = prices[0] ? (change / prices[0]) * 100 : 0
  
  return { max, min, avg, change, changePercent }
})

const goldTrend = computed(() => {
  if (goldHistory.value.length < 2) return 'stable'
  const lastTwo = goldHistory.value.slice(-2)
  if (lastTwo[1] > lastTwo[0]) return 'up'
  if (lastTwo[1] < lastTwo[0]) return 'down'
  return 'stable'
})

const goldHighTime = computed(() => {
  if (!goldData.value) return ''
  const prices = [...goldHistory.value, goldData.value.price]
  const max = Math.max(...prices)
  const index = prices.indexOf(max)
  if (index === prices.length - 1) return 'Current'
  if (index < goldTimestamps.value.length) {
    const mins = Math.floor((new Date() - goldTimestamps.value[index]) / 60000)
    return `${mins}m ago`
  }
  return ''
})

const goldLowTime = computed(() => {
  if (!goldData.value) return ''
  const prices = [...goldHistory.value, goldData.value.price]
  const min = Math.min(...prices)
  const index = prices.indexOf(min)
  if (index === prices.length - 1) return 'Current'
  if (index < goldTimestamps.value.length) {
    const mins = Math.floor((new Date() - goldTimestamps.value[index]) / 60000)
    return `${mins}m ago`
  }
  return ''
})

const getGoldBarHeight = (price) => {
  const range = goldStats.value.max - goldStats.value.min || 1
  return ((price - goldStats.value.min) / range) * 80 + 10
}

const getGoldBarClass = (price) => {
  if (!goldData.value) return ''
  return price > goldData.value.price ? 'above' : price < goldData.value.price ? 'below' : ''
}

const getGoldBarTime = (index) => {
  if (index < goldTimestamps.value.length) {
    const mins = Math.floor((new Date() - goldTimestamps.value[index]) / 60000)
    return `${mins}m ago`
  }
  return 'current'
}

// ============== DXY COMPUTED ==============
const dxyStats = computed(() => {
  const prices = [...dxyHistory.value, dxyData.value?.ld].filter(p => p)
  if (prices.length === 0) {
    return { 
      max: dxyData.value?.ld || 0, 
      min: dxyData.value?.ld || 0, 
      avg: dxyData.value?.ld || 0, 
      change: 0, 
      changePercent: 0 
    }
  }
  
  const max = Math.max(...prices)
  const min = Math.min(...prices)
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length
  const change = prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0
  const changePercent = prices[0] ? (change / prices[0]) * 100 : 0
  
  return { max, min, avg, change, changePercent }
})

const dxyTrend = computed(() => {
  if (dxyHistory.value.length < 2) return 'stable'
  const lastTwo = dxyHistory.value.slice(-2)
  if (lastTwo[1] > lastTwo[0]) return 'up'
  if (lastTwo[1] < lastTwo[0]) return 'down'
  return 'stable'
})

const dxyHighTime = computed(() => {
  if (!dxyData.value) return ''
  const prices = [...dxyHistory.value, dxyData.value.ld]
  const max = Math.max(...prices)
  const index = prices.indexOf(max)
  if (index === prices.length - 1) return 'Current'
  if (index < dxyTimestamps.value.length) {
    const mins = Math.floor((new Date() - dxyTimestamps.value[index]) / 60000)
    return `${mins}m ago`
  }
  return ''
})

const dxyLowTime = computed(() => {
  if (!dxyData.value) return ''
  const prices = [...dxyHistory.value, dxyData.value.ld]
  const min = Math.min(...prices)
  const index = prices.indexOf(min)
  if (index === prices.length - 1) return 'Current'
  if (index < dxyTimestamps.value.length) {
    const mins = Math.floor((new Date() - dxyTimestamps.value[index]) / 60000)
    return `${mins}m ago`
  }
  return ''
})

const getDxyBarHeight = (price) => {
  const range = dxyStats.value.max - dxyStats.value.min || 1
  return ((price - dxyStats.value.min) / range) * 80 + 10
}

const getDxyBarClass = (price) => {
  if (!dxyData.value) return ''
  return price > dxyData.value.ld ? 'above' : price < dxyData.value.ld ? 'below' : ''
}

const getDxyBarTime = (index) => {
  if (index < dxyTimestamps.value.length) {
    const mins = Math.floor((new Date() - dxyTimestamps.value[index]) / 60000)
    return `${mins}m ago`
  }
  return 'current'
}

// ============== VPS/TELEGRAM FUNCTIONS ==============
const unreadAlerts = computed(() => alerts.value.filter(a => !a.read))

const highSeverityAlerts = computed(() => {
  return alerts.value.filter(a => a.severity === 'danger').length
})

const last24hAlerts = computed(() => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return alerts.value.filter(a => new Date(a.timestamp) > oneDayAgo).length
})


const clearAllAlerts = () => {
  alerts.value = []
  notification.info('All alerts cleared')
}


// ============== TIMERS ==============
const startTimers = () => {
  // Fetch gold every 60 seconds
  goldTimerInterval = setInterval(() => {
    fetchGoldPrice()
    fetchDXYPrice()
  }, 60000)
  
  // Update countdown every second
  countdownInterval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      countdown.value = 60
    }
  }, 1000)
  
  // Simulate VPS heartbeat every 30 seconds
  setInterval(() => {
    lastHeartbeat.value = 'Just now'
    setTimeout(() => {
      lastHeartbeat.value = '30s ago'
    }, 5000)
  }, 30000)

  // Fetch notifications every 30 seconds
  notificationPollingInterval = setInterval(() => {
    fetchNotifications()
  }, 30000)
}

// ============== FORMATTING FUNCTIONS ==============
const formatPrice = (price) => {
  if (!price) return '---'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

const formatDxyPrice = (price) => {
  if (!price) return '---'
  return price.toFixed(3)
}

const formatDxyChange = (change) => {
  if (change === 0) return '0.000'
  return `${change > 0 ? '+' : ''}${change.toFixed(3)}`
}

const formatDxyTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  return date.toLocaleTimeString()
}

const formatLastUpdated = (readable, timestamp) => {
  if (readable) return readable
  if (!timestamp) return 'Unknown'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  return date.toLocaleString()
}

const formatChange = (change) => {
  if (change === 0) return '0.00'
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}`
}

const formatChangePercent = (change) => {
  if (change === 0) return '0.00%'
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
}

const getChangeClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return ''
}

const formatNotificationTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return date.toLocaleDateString()
}

// ============== WATCHERS ==============
watch(activeTab, (newTab) => {
  if (newTab === 'telegram') {
    // Get unread message IDs
    const unreadIds = notifications.value
      .filter(n => !n.has_read)
      .map(n => n.id)
    
    if (unreadIds.length > 0) {
      // Call API to update status
      updateNotificationStatus(unreadIds).then(success => {
        if (success) {
          // Mark as read locally
          notifications.value.forEach(n => n.has_read = true)
          
          // Update localStorage
          localStorage.setItem('notification_cache', JSON.stringify(notifications.value))
          window.dispatchEvent(new Event('storage'))
        }
      })
    }
  }
})

// ============== LIFECYCLE ==============
onMounted(() => {
  fetchGoldPrice()
  fetchDXYPrice()
  fetchNotifications()
  startTimers()

  // Load processed message IDs from localStorage
  const savedIds = localStorage.getItem('processed_message_ids')
  if (savedIds) {
    try {
      const ids = JSON.parse(savedIds)
      processedMessageIds.value = new Set(ids)
    } catch (err) {
      console.error('Failed to load processed message IDs:', err)
    }
  }

  // Listen for storage events (for cross-tab sync)
  window.addEventListener('storage', (e) => {
    if (e.key === 'notification_cache') {
      try {
        const cached = JSON.parse(e.newValue)
        if (cached) {
          notifications.value = cached
        }
      } catch (err) {
        console.error('Failed to parse notification cache:', err)
      }
    } else if (e.key === 'processed_message_ids') {
      try {
        const ids = JSON.parse(e.newValue)
        processedMessageIds.value = new Set(ids)
      } catch (err) {
        console.error('Failed to parse processed message IDs:', err)
      }
    }
  })
})

onUnmounted(() => {
  if (goldTimerInterval) clearInterval(goldTimerInterval)
  if (countdownInterval) clearInterval(countdownInterval)
  if (notificationPollingInterval) clearInterval(notificationPollingInterval)
  
  // Save processed message IDs to localStorage
  localStorage.setItem('processed_message_ids', JSON.stringify([...processedMessageIds.value]))
})
</script>

<style scoped>
  @import '../assets/styles/market.css';
</style>