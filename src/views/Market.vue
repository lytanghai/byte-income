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
const alertsPerPage = ref(20)
const hasMoreAlerts = ref(false)

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

const playNotificationSound = () => {
  try {
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
const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    if (alertFilter.severity && alert.severity !== alertFilter.severity) return false
    if (alertFilter.type && alert.type !== alertFilter.type) return false
    if (alertFilter.symbol && !alert.symbol.toLowerCase().includes(alertFilter.symbol.toLowerCase())) return false
    return true
  })
})

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

const markAlertAsRead = (alert) => {
  alert.read = true
}

const loadMoreAlerts = () => {
  alertPage.value++
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

const formatAlertTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return date.toLocaleDateString()
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
/* Keep ALL your existing styles exactly as they were */
.market-page {
  padding: clamp(12px, 2.25vw, 18px);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 18px;
}

.page-header h1 {
  margin: 0 0 6px 0;
  color: var(--text-main);
  font-size: clamp(18px, 3vw, 24px);
}

.page-header .subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 10.5px;
}

.dark .page-header .subtitle {
  color: #9ca3af;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
}

.dark .tab-navigation {
  border-bottom-color: #374151;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-btn.active {
  background: #3b82f6;
  color: white;
}

.dark .tab-btn:hover {
  background: #374151;
  color: #e5e7eb;
}

.tab-icon {
  font-size: 16px;
}

.tab-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Connection Status */
.connection-status {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 16px;
  margin-bottom: 18px;
  background: white;
  border-radius: 30px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  width: fit-content;
  flex-wrap: wrap;
}

.dark .connection-status {
  background: #1f2937;
}

.connection-status.connected {
  border-left: 3px solid #10b981;
}

.connection-status.connecting {
  border-left: 3px solid #f59e0b;
}

.connection-status.disconnected {
  border-left: 3px solid #ef4444;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.connected .status-indicator {
  background: #10b981;
  animation: pulse 2s infinite;
}

.connecting .status-indicator {
  background: #f59e0b;
  animation: pulse 1s infinite;
}

.disconnected .status-indicator {
  background: #ef4444;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.status-text {
  font-size: 11px;
  color: #374151;
}

.dark .status-text {
  color: #e5e7eb;
}

.next-update {
  font-size: 10px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 12px;
}

.dark .next-update {
  background: #374151;
  color: #9ca3af;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #2563eb;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  display: inline-block;
  font-size: 10px;
}

.refresh-icon.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* VPS Status (Telegram Tab) */
.vps-status {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 16px;
  margin-bottom: 18px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark .vps-status {
  background: #1f2937;
}

.vps-status.connected {
  border-left: 3px solid #10b981;
}

.vps-status.disconnected {
  border-left: 3px solid #ef4444;
}

.last-heartbeat {
  font-size: 10px;
  color: #6b7280;
  margin-left: auto;
}

/* VPS Controls */
.vps-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}



.btn-clear {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-clear:hover {
  background: #dc2626;
}

.btn-clear-small {
  padding: 4px 8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 9px;
  cursor: pointer;
}

.btn-icon {
  font-size: 14px;
}

/* VPS Stats */
.vps-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}

.stat-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.dark .stat-card {
  background: #374151;
}

.stat-label {
  display: block;
  font-size: 8px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.dark .stat-value {
  color: white;
}

/* Alert Filters */
.alert-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.filter-select,
.filter-input {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 10px;
  background: white;
  color: #1f2937;
  min-width: 120px;
}

.dark .filter-select,
.dark .filter-input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.filter-input {
  flex: 1;
  min-width: 150px;
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 13px;
  color: #1f2937;
}

.dark .section-header h3 {
  color: white;
}

/* Notifications Section */
.notifications-section {
  margin-bottom: 24px;
}

.no-notifications {
  text-align: center;
  padding: 30px;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 8px;
}

.dark .no-notifications {
  background: #374151;
}

.no-notifications-icon {
  font-size: 30px;
  margin-bottom: 8px;
  display: block;
}

.no-notifications p {
  margin: 0;
  font-size: 11px;
}

.notification-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.notification-card:hover {
  transform: translateX(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-card.unread {
  background: #dbeafe;
}

.dark .notification-card {
  background: #374151;
}

.dark .notification-card.unread {
  background: #1e3a8a;
}

.notification-icon {
  font-size: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  flex-shrink: 0;
}

.dark .notification-icon {
  background: #4b5563;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  flex-wrap: wrap;
  gap: 4px;
}

.notification-title {
  font-size: 11px;
  font-weight: 600;
  color: #1f2937;
}

.dark .notification-title {
  color: white;
}

.notification-time {
  font-size: 8px;
  color: #6b7280;
}

.notification-message {
  margin: 0 0 4px 0;
  font-size: 10px;
  color: #4b5563;
  line-height: 1.4;
}

.dark .notification-message {
  color: #9ca3af;
}

.notification-extra {
  font-size: 9px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.dark .notification-extra {
  background: #4b5563;
  color: #9ca3af;
}

/* Charts Grid Layout */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* Price Cards */
.price-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.price-card:hover {
  transform: translateY(-2px);
}

.gold-card {
  background: linear-gradient(135deg, #f5e7d3 0%, #f8f0e3 100%);
  border: 1px solid #e9d9c4;
}

.dxy-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
  border: 1px solid #bbdefb;
}

.dark .gold-card {
  background: linear-gradient(135deg, #2d2a24 0%, #353027 100%);
  border-color: #5f4e3a;
}

.dark .dxy-card {
  background: linear-gradient(135deg, #1a2a3a 0%, #1f2f3f 100%);
  border-color: #2c3e50;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  font-size: 24px;
}

.card-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.gold-card .card-title h2 {
  color: #b8860b;
}

.dxy-card .card-title h2 {
  color: #1976d2;
}

.dark .gold-card .card-title h2 {
  color: #fbbf24;
}

.dark .dxy-card .card-title h2 {
  color: #64b5f6;
}

.card-symbol {
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.last-updated {
  font-size: 10px;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.5);
  padding: 4px 10px;
  border-radius: 20px;
}

.dark .last-updated {
  background: rgba(0, 0, 0, 0.3);
  color: #9ca3af;
}

.price-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.price-main {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.gold-card .price-value {
  color: #b8860b;
}

.dxy-card .price-value {
  color: #1976d2;
}

.dark .gold-card .price-value {
  color: #fbbf24;
}

.dark .dxy-card .price-value {
  color: #64b5f6;
}

.price-currency {
  font-size: 12px;
  color: #6b7280;
}

.price-change {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  min-width: 160px;
}

.dark .price-change {
  background: rgba(0, 0, 0, 0.3);
}

.price-change.up {
  color: #10b981;
}

.price-change.down {
  color: #ef4444;
}

.price-change.stable {
  color: #6b7280;
}

.trend-icon {
  font-size: 16px;
}

.trend-details {
  display: flex;
  flex-direction: column;
}

.trend-text {
  font-size: 10px;
  font-weight: 500;
}

.trend-change {
  font-size: 9px;
  opacity: 0.9;
}

/* Price Chart */
.price-chart {
  margin-bottom: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-header h3 {
  margin: 0;
  font-size: 12px;
  color: #1f2937;
}

.dark .chart-header h3 {
  color: white;
}

.chart-interval {
  font-size: 9px;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.5);
  padding: 2px 6px;
  border-radius: 10px;
}

.chart-container {
  display: flex;
  gap: 8px;
  height: 120px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 10px;
}

.dark .chart-container {
  background: rgba(0, 0, 0, 0.2);
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 8px;
  color: #6b7280;
  padding-right: 8px;
  border-right: 1px solid #d1d5db;
  min-width: 45px;
}

.dark .chart-y-axis {
  border-right-color: #4b5563;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  position: relative;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  height: 100%;
}

.chart-bar {
  width: 100%;
  background: #d4a373;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s;
  position: relative;
  min-height: 3px;
  cursor: pointer;
}

.chart-bar.above {
  background: #10b981;
}

.chart-bar.below {
  background: #ef4444;
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 7px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 10;
  line-height: 1.4;
  text-align: center;
}

.chart-bar:hover .bar-tooltip {
  opacity: 1;
}

.bar-label {
  font-size: 7px;
  color: #6b7280;
  transform: rotate(-45deg);
  white-space: nowrap;
}

/* Price Stats */
.price-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 8px;
  color: #6b7280;
  margin-bottom: 2px;
}

.stat-value {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.dark .stat-value {
  color: white;
}

.stat-value.positive {
  color: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

.stat-time {
  font-size: 7px;
  color: #6b7280;
}

/* Alerts Section */
.alerts-section {
  margin-top: 24px;
}

.alerts-container {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.alert-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.alert-card:hover {
  transform: translateX(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alert-card.unread {
  background: #dbeafe;
}

.alert-card.danger {
  border-left: 3px solid #ef4444;
}

.alert-card.warning {
  border-left: 3px solid #f59e0b;
}

.alert-card.info {
  border-left: 3px solid #3b82f6;
}

.dark .alert-card {
  background: #374151;
}

.dark .alert-card.unread {
  background: #1e3a8a;
}

.alert-icon {
  font-size: 18px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
}

.dark .alert-icon {
  background: #4b5563;
}

.alert-content {
  flex: 1;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.alert-title {
  font-size: 11px;
  font-weight: 600;
  color: #1f2937;
}

.dark .alert-title {
  color: white;
}

.alert-time {
  font-size: 8px;
  color: #6b7280;
}

.alert-message {
  margin: 0 0 6px;
  font-size: 10px;
  color: #4b5563;
  line-height: 1.4;
}

.dark .alert-message {
  color: #9ca3af;
}

.alert-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.alert-symbol {
  padding: 2px 6px;
  background: #e5e7eb;
  border-radius: 3px;
  font-size: 8px;
  color: #374151;
}

.dark .alert-symbol {
  background: #4b5563;
  color: #e5e7eb;
}

.alert-severity {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 500;
}

.alert-severity.danger {
  background: #fee2e2;
  color: #991b1b;
}

.alert-severity.warning {
  background: #fef3c7;
  color: #92400e;
}

.alert-severity.info {
  background: #dbeafe;
  color: #1e40af;
}

.dark .alert-severity.danger {
  background: #7f1d1d;
  color: #fecaca;
}

.dark .alert-severity.warning {
  background: #78350f;
  color: #fcd34d;
}

.dark .alert-severity.info {
  background: #1e3a8a;
  color: #93c5fd;
}

.alert-type {
  padding: 2px 6px;
  background: #e5e7eb;
  border-radius: 3px;
  font-size: 8px;
  color: #374151;
}

.dark .alert-type {
  background: #4b5563;
  color: #e5e7eb;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  position: absolute;
  top: 12px;
  right: 12px;
}

/* Load More */
.load-more {
  text-align: center;
  margin-top: 16px;
}

.btn-load-more {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
}

.btn-load-more:hover {
  background: #f3f4f6;
}

.dark .btn-load-more {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.loading-state.small {
  padding: 30px;
}

.dark .loading-state {
  background: #1f2937;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-bottom: 8px;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.error-state.small {
  padding: 30px;
}

.dark .error-state {
  background: #1f2937;
}

.error-message {
  color: #ef4444;
  margin-bottom: 16px;
  font-size: 14px;
}

.btn-retry {
  padding: 8px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-retry:hover {
  background: #2563eb;
}

/* No Alerts */
.no-alerts {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.no-alerts-icon {
  font-size: 40px;
  margin-bottom: 12px;
  display: block;
}

.no-alerts p {
  margin: 0;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .tab-navigation {
    flex-direction: column;
  }
  
  .tab-btn {
    width: 100%;
    justify-content: center;
  }
  
  .connection-status {
    width: 100%;
    justify-content: center;
  }
  
  .price-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .price-change {
    width: 100%;
  }
  
  .price-value {
    font-size: 28px;
  }
  
  .chart-container {
    height: 100px;
  }
  
  .vps-controls {
    flex-direction: column;
  }
  
  .alert-filters {
    flex-direction: column;
  }
  
  .filter-select,
  .filter-input {
    width: 100%;
  }
  
  .vps-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .price-value {
    font-size: 24px;
  }
  
  .price-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .vps-stats {
    grid-template-columns: 1fr;
  }
  
  .price-change {
    padding: 6px 10px;
  }
  
  .trend-details {
    font-size: 9px;
  }
  
  .alert-card,
  .notification-card {
    flex-direction: column;
  }
  
  .alert-icon,
  .notification-icon {
    align-self: flex-start;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .alert-meta {
    flex-direction: column;
    gap: 4px;
  }
}

/* Touch Improvements */
@media (hover: none) and (pointer: coarse) {
  .tab-btn,
  .btn-refresh,
  .btn-clear,
  .btn-load-more,
  .btn-retry,
  .filter-select,
  .filter-input {
    padding: 12px;
    font-size: 14px;
  }
  
  .chart-bar {
    min-height: 6px;
  }
  
  .alert-card,
  .notification-card {
    padding: 15px;
  }
  
  .alert-icon,
  .notification-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}
</style>