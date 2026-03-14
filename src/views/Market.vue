<template>
  <div class="market-page">
    <!-- Header -->
    <div class="page-header">
      <h1>Market</h1>
      <p class="subtitle">Real-time gold price and VPS alerts</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'gold' }"
        @click="activeTab = 'gold'"
      >
        <!-- <span class="tab-icon">🥇</span> -->
        Chart
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'telegram' }"
        @click="activeTab = 'telegram'"
      >
        <span class="tab-icon">📱</span>
        Notification
        <span v-if="unreadAlerts.length > 0" class="tab-badge">{{ unreadAlerts.length }}</span>
      </button>
    </div>

    <!-- Gold Price Tab -->
    <div v-show="activeTab === 'gold'" class="gold-tab">
      <!-- Connection Status -->
      <div class="connection-status" :class="connectionState">
        <span class="status-indicator"></span>
        <span class="status-text">{{ connectionMessage }}</span>
        <span class="next-update">Next update in {{ countdown }}s</span>
        <button @click="forceRefresh" class="btn-refresh" :disabled="loading">
          <span class="refresh-icon" :class="{ 'spin': loading }">↻</span>
          Refresh
        </button>
      </div>

      <!-- Gold Price Card -->
      <div class="gold-card" v-if="goldData">
        <div class="gold-header">
          <div class="gold-title">
            <span class="gold-icon">🥇</span>
            <h2>{{ goldData.name }}</h2>
            <span class="gold-symbol">{{ goldData.symbol }}</span>
          </div>
          <div class="last-updated">
            {{ formatLastUpdated(goldData.updatedAtReadable, goldData.updatedAt) }}
          </div>
        </div>

        <div class="gold-price-container">
          <div class="gold-price">
            <span class="price-label">Spot Price</span>
            <span class="price-value">{{ formatPrice(goldData.price) }}</span>
            <span class="price-currency">USD/oz</span>
          </div>

          <!-- 30-Minute Price Change -->
          <div class="price-change-indicator" :class="priceTrend">
            <span class="trend-icon">{{ priceTrend === 'up' ? '▲' : priceTrend === 'down' ? '▼' : '◆' }}</span>
            <div class="trend-details">
              <span class="trend-text">{{ priceTrend === 'up' ? 'Rising' : priceTrend === 'down' ? 'Falling' : 'Stable' }}</span>
              <span class="trend-change" :class="getChangeClass(calculate30MinChange)">
                {{ formatChange(calculate30MinChange) }} ({{ formatChangePercent(calculate30MinChangePercent) }})
              </span>
            </div>
          </div>
        </div>

        <!-- 30-Minute Price Chart -->
        <div class="price-chart">
          <div class="chart-header">
            <h3>Price Movement (Last 30 Minutes)</h3>
            <span class="chart-interval">30 data points • 1 min intervals</span>
          </div>
          <div class="chart-container">
            <!-- Y-axis labels -->
            <div class="chart-y-axis">
              <span>{{ formatPrice(priceStats.max) }}</span>
              <span>{{ formatPrice(priceStats.avg) }}</span>
              <span>{{ formatPrice(priceStats.min) }}</span>
            </div>
            
            <!-- Chart bars -->
            <div class="chart-bars">
              <div 
                v-for="(price, index) in priceHistory" 
                :key="index"
                class="chart-bar-wrapper"
              >
                <div 
                  class="chart-bar"
                  :style="{ height: getBarHeight(price) + '%' }"
                  :class="getBarClass(price)"
                >
                  <span class="bar-tooltip">
                    {{ formatPrice(price) }}<br>
                    {{ getBarTime(index) }}
                  </span>
                </div>
                <span class="bar-label" v-if="index % 5 === 0">{{ index }}m</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 30-Minute Statistics -->
        <div class="price-stats">
          <div class="stat-card">
            <span class="stat-label">30m High</span>
            <span class="stat-value">{{ formatPrice(priceStats.max) }}</span>
            <span class="stat-time">{{ getHighTime }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">30m Low</span>
            <span class="stat-value">{{ formatPrice(priceStats.min) }}</span>
            <span class="stat-time">{{ getLowTime }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">30m Open</span>
            <span class="stat-value">{{ formatPrice(priceStats.open) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">30m Close</span>
            <span class="stat-value">{{ formatPrice(priceStats.close) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">30m Change</span>
            <span class="stat-value" :class="getChangeClass(priceStats.change)">
              {{ formatChange(priceStats.change) }}
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-label">30m Change %</span>
            <span class="stat-value" :class="getChangeClass(priceStats.changePercent)">
              {{ formatChangePercent(priceStats.changePercent) }}
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-label">30m Volatility</span>
            <span class="stat-value">{{ priceStats.volatility.toFixed(2) }}%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">30m Avg</span>
            <span class="stat-value">{{ formatPrice(priceStats.avg) }}</span>
          </div>
        </div>

        <!-- Price Alerts -->
        <div class="price-alerts" v-if="priceAlerts.length > 0">
          <div class="alerts-title">
            <span class="alert-icon">⚠️</span>
            <span>30-Minute Alerts</span>
          </div>
          <div class="alerts-scroll">
            <div 
              v-for="(alert, index) in priceAlerts" 
              :key="index"
              class="price-alert-item"
              :class="alert.type"
            >
              <span class="alert-time">{{ alert.time }}</span>
              <span class="alert-message">{{ alert.message }}</span>
              <span class="alert-change" :class="alert.type">{{ alert.change }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading && !goldData" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching gold price...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="fetchGoldPrice" class="btn-retry">Retry</button>
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
        <button class="btn-test" @click="sendTestAlert">
          <span class="btn-icon">📨</span>
          Send Test Alert
        </button>
        <button class="btn-clear" @click="clearAllAlerts" v-if="alerts.length > 0">
          <span class="btn-icon">🗑️</span>
          Clear All
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

      <!-- Alerts List -->
      <div class="alerts-container">
        <div v-if="filteredAlerts.length === 0" class="no-alerts">
          <span class="no-alerts-icon">📭</span>
          <p>No alerts match your filters</p>
        </div>

        <div 
          v-for="alert in filteredAlerts" 
          :key="alert.id"
          class="alert-card"
          :class="[alert.severity, { 'unread': !alert.read }]"
          @click="markAlertAsRead(alert)"
        >
          <div class="alert-icon">
            <span v-if="alert.type === 'VOLATILITY'">🌪️</span>
            <span v-else-if="alert.type === 'PRICE_SPIKE'">📈</span>
            <span v-else-if="alert.type === 'NEWS'">📰</span>
            <span v-else>⚠️</span>
          </div>

          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-title">{{ alert.title }}</span>
              <span class="alert-time">{{ formatAlertTime(alert.timestamp) }}</span>
            </div>
            <p class="alert-message">{{ alert.message }}</p>
            <div class="alert-meta">
              <span class="alert-symbol">{{ alert.symbol }}</span>
              <span class="alert-severity" :class="alert.severity">{{ alert.severity }}</span>
              <span class="alert-type">{{ alert.type }}</span>
            </div>
          </div>

          <div v-if="!alert.read" class="unread-indicator"></div>
        </div>

        <!-- Load More -->
        <div v-if="hasMoreAlerts" class="load-more">
          <button @click="loadMoreAlerts" class="btn-load-more">
            Load More
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useNotification } from '../composables/useNotification'

const notification = useNotification()

// ============== TAB STATE ==============
const activeTab = ref('gold') // 'gold' or 'telegram'

// ============== GOLD API ==============
const API_URL = 'https://api.gold-api.com/price/XAU'

// Gold state
const goldData = ref(null)
const loading = ref(false)
const error = ref(null)
const connectionState = ref('connected')
const connectionMessage = ref('Connected to Gold API')
const countdown = ref(60)

// Price history - store 30 data points (30 minutes)
const priceHistory = ref([])
const priceTimestamps = ref([])
const priceAlerts = ref([])

let timerInterval = null
let countdownInterval = null

// ============== VPS/TELEGRAM STATE ==============
const vpsConnectionState = ref('connected')
const vpsConnectionMessage = ref('VPS Connected')
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

// Sample test alerts (for demo)
const sampleAlerts = [
  {
    id: 1,
    type: 'VOLATILITY',
    title: 'High Volatility Detected',
    message: 'Gold volatility spiked to 2.5% in the last minute',
    symbol: 'XAU/USD',
    severity: 'danger',
    timestamp: new Date(Date.now() - 2 * 60000),
    read: false
  },
  {
    id: 2,
    type: 'PRICE_SPIKE',
    title: 'Price Spike Alert',
    message: 'BTC/USD jumped 3.2% in 5 minutes',
    symbol: 'BTC/USD',
    severity: 'warning',
    timestamp: new Date(Date.now() - 15 * 60000),
    read: false
  },
  {
    id: 3,
    type: 'NEWS',
    title: 'Fed Interest Rate Decision',
    message: 'Fed announces 0.25% rate cut',
    symbol: 'DXY',
    severity: 'info',
    timestamp: new Date(Date.now() - 45 * 60000),
    read: true
  },
  {
    id: 4,
    type: 'VOLATILITY',
    title: 'Silver Volatility',
    message: 'XAG/USD showing increased volatility',
    symbol: 'XAG/USD',
    severity: 'warning',
    timestamp: new Date(Date.now() - 120 * 60000),
    read: true
  }
]

// Initialize with sample alerts
alerts.value = [...sampleAlerts]

// ============== GOLD API FUNCTIONS ==============
const fetchGoldPrice = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = null
  connectionState.value = 'connecting'
  connectionMessage.value = 'Fetching gold price...'

  try {
    const response = await fetch(API_URL)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Store previous price with timestamp
    if (goldData.value) {
      priceHistory.value.push(goldData.value.price)
      priceTimestamps.value.push(new Date())
      
      // Keep only last 30 data points (30 minutes)
      if (priceHistory.value.length > 30) {
        priceHistory.value.shift()
        priceTimestamps.value.shift()
      }
      
      // Check for significant movements
      checkFor30MinAlerts(data.price)
    }
    
    goldData.value = data
    
    connectionState.value = 'connected'
    connectionMessage.value = 'Connected to Gold API'
    
    // Reset countdown
    countdown.value = 60
    
  } catch (err) {
    error.value = err.message
    connectionState.value = 'disconnected'
    connectionMessage.value = 'Failed to fetch gold price'
    notification.error(`Failed to fetch gold price: ${err.message}`)
  } finally {
    loading.value = false
  }
}

const forceRefresh = () => {
  fetchGoldPrice()
  countdown.value = 60
}

// ============== 30-MINUTE ANALYSIS ==============
const priceStats = computed(() => {
  if (priceHistory.value.length === 0) {
    return {
      max: goldData.value?.price || 0,
      min: goldData.value?.price || 0,
      avg: goldData.value?.price || 0,
      open: goldData.value?.price || 0,
      close: goldData.value?.price || 0,
      change: 0,
      changePercent: 0,
      volatility: 0
    }
  }
  
  const prices = priceHistory.value
  const currentPrice = goldData.value?.price || prices[prices.length - 1]
  
  const max = Math.max(...prices, currentPrice)
  const min = Math.min(...prices, currentPrice)
  const avg = [...prices, currentPrice].reduce((a, b) => a + b, 0) / (prices.length + 1)
  const open = prices[0] || currentPrice
  const close = currentPrice
  const change = close - open
  const changePercent = (change / open) * 100
  
  // Calculate volatility (standard deviation of returns)
  const returns = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1])
  }
  if (prices.length > 0) {
    returns.push((currentPrice - prices[prices.length-1]) / prices[prices.length-1])
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length
  const volatility = Math.sqrt(variance) * 100
  
  return {
    max,
    min,
    avg,
    open,
    close,
    change,
    changePercent,
    volatility
  }
})

const priceTrend = computed(() => {
  if (priceHistory.value.length < 2) return 'stable'
  const lastTwo = [...priceHistory.value.slice(-2), goldData.value?.price].filter(p => p)
  if (lastTwo.length < 2) return 'stable'
  if (lastTwo[1] > lastTwo[0]) return 'up'
  if (lastTwo[1] < lastTwo[0]) return 'down'
  return 'stable'
})

const calculate30MinChange = computed(() => {
  return priceStats.value.change
})

const calculate30MinChangePercent = computed(() => {
  return priceStats.value.changePercent
})

const getHighTime = computed(() => {
  if (!goldData.value) return ''
  const prices = [...priceHistory.value, goldData.value.price]
  const max = Math.max(...prices)
  const index = prices.indexOf(max)
  if (index === prices.length - 1) return 'Current'
  if (index < priceTimestamps.value.length) {
    const time = priceTimestamps.value[index]
    const mins = Math.floor((new Date() - time) / 60000)
    return `${mins}m ago`
  }
  return ''
})

const getLowTime = computed(() => {
  if (!goldData.value) return ''
  const prices = [...priceHistory.value, goldData.value.price]
  const min = Math.min(...prices)
  const index = prices.indexOf(min)
  if (index === prices.length - 1) return 'Current'
  if (index < priceTimestamps.value.length) {
    const time = priceTimestamps.value[index]
    const mins = Math.floor((new Date() - time) / 60000)
    return `${mins}m ago`
  }
  return ''
})

const checkFor30MinAlerts = (newPrice) => {
  if (priceHistory.value.length === 0) return
  
  const alerts = []
  
  // Check for 1% movement in 30 minutes
  const thirtyMinChange = ((newPrice - priceHistory.value[0]) / priceHistory.value[0]) * 100
  if (Math.abs(thirtyMinChange) > 1) {
    alerts.push({
      type: thirtyMinChange > 0 ? 'positive' : 'negative',
      message: `30min ${thirtyMinChange > 0 ? 'gain' : 'loss'} of ${Math.abs(thirtyMinChange).toFixed(2)}%`,
      change: `${thirtyMinChange > 0 ? '+' : ''}${thirtyMinChange.toFixed(2)}%`,
      time: '30m'
    })
  }
  
  // Check for 0.5% movement in 5 minutes
  if (priceHistory.value.length >= 5) {
    const fiveMinChange = ((newPrice - priceHistory.value[priceHistory.value.length - 5]) / priceHistory.value[priceHistory.value.length - 5]) * 100
    if (Math.abs(fiveMinChange) > 0.5) {
      alerts.push({
        type: fiveMinChange > 0 ? 'positive' : 'negative',
        message: `5min ${fiveMinChange > 0 ? 'spike' : 'drop'} of ${Math.abs(fiveMinChange).toFixed(2)}%`,
        change: `${fiveMinChange > 0 ? '+' : ''}${fiveMinChange.toFixed(2)}%`,
        time: '5m'
      })
    }
  }
  
  // Check volatility
  if (priceStats.value.volatility > 0.3) {
    alerts.push({
      type: 'warning',
      message: `High volatility detected (${priceStats.value.volatility.toFixed(2)}%)`,
      change: `${priceStats.value.volatility.toFixed(2)}%`,
      time: '30m'
    })
  }
  
  // Add alerts
  alerts.forEach(alert => {
    priceAlerts.value.unshift({
      ...alert,
      id: Date.now() + Math.random()
    })
    
    // Create notification for significant alerts
    if (Math.abs(parseFloat(alert.change)) > 1) {
      notification.showNotification({
        type: alert.type === 'positive' ? 'success' : alert.type === 'negative' ? 'error' : 'warning',
        message: `Gold: ${alert.message}`,
        duration: 5000
      })
    }
  })
  
  // Keep only last 10 alerts
  if (priceAlerts.value.length > 10) {
    priceAlerts.value = priceAlerts.value.slice(0, 10)
  }
}

const getBarHeight = (price) => {
  const stats = priceStats.value
  const range = stats.max - stats.min || 1
  return ((price - stats.min) / range) * 80 + 10
}

const getBarClass = (price) => {
  if (!goldData.value) return ''
  return price > goldData.value.price ? 'above' : price < goldData.value.price ? 'below' : ''
}

const getBarTime = (index) => {
  if (index < priceTimestamps.value.length) {
    const time = priceTimestamps.value[index]
    const mins = Math.floor((new Date() - time) / 60000)
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

const sendTestAlert = () => {
  const types = ['VOLATILITY', 'PRICE_SPIKE', 'NEWS']
  const severities = ['danger', 'warning', 'info']
  const symbols = ['XAU/USD', 'BTC/USD', 'EUR/USD', 'DXY', 'XAG/USD']
  
  const newAlert = {
    id: Date.now(),
    type: types[Math.floor(Math.random() * types.length)],
    title: `Test Alert ${Math.floor(Math.random() * 100)}`,
    message: 'This is a test alert from VPS',
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    timestamp: new Date(),
    read: false
  }
  
  alerts.value.unshift(newAlert)
  vpsConnectionState.value = 'connected'
  vpsConnectionMessage.value = 'VPS Connected'
  lastHeartbeat.value = 'Just now'
  
  notification.success('Test alert sent successfully')
}

const clearAllAlerts = () => {
  alerts.value = []
  notification.info('All alerts cleared')
}

const markAlertAsRead = (alert) => {
  alert.read = true
}

const loadMoreAlerts = () => {
  // Simulate loading more alerts
  alertPage.value++
  // In real app, fetch more from API
}

// ============== TIMERS ==============
const startTimers = () => {
  // Fetch gold every 60 seconds
  timerInterval = setInterval(() => {
    fetchGoldPrice()
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

// ============== LIFECYCLE ==============
onMounted(() => {
  fetchGoldPrice()
  startTimers()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<style scoped>
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

/* Connection Status (Gold Tab) */
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
}

.btn-test {
  padding: 8px 16px;
  background: #10b981;
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

.btn-test:hover {
  background: #059669;
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

.btn-icon {
  font-size: 14px;
}

/* VPS Stats */
.vps-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 18px;
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

/* Alerts Container */
.alerts-container {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 4px;
}

/* Gold Card */
.gold-card {
  background: linear-gradient(135deg, #f5e7d3 0%, #f8f0e3 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9d9c4;
}

.dark .gold-card {
  background: linear-gradient(135deg, #2d2a24 0%, #353027 100%);
  border-color: #5f4e3a;
}

.gold-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.gold-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gold-icon {
  font-size: 32px;
}

.gold-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #b8860b;
}

.dark .gold-title h2 {
  color: #fbbf24;
}

.gold-symbol {
  padding: 2px 8px;
  background: rgba(184, 134, 11, 0.2);
  color: #b8860b;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.dark .gold-symbol {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
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

.gold-price-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.gold-price {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.price-value {
  font-size: 48px;
  font-weight: 700;
  color: #b8860b;
  line-height: 1.2;
}

.dark .price-value {
  color: #fbbf24;
}

.price-currency {
  font-size: 14px;
  color: #6b7280;
}

.price-change-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 30px;
  background: white;
  min-width: 200px;
}

.dark .price-change-indicator {
  background: #374151;
}

.price-change-indicator.up {
  color: #10b981;
}

.price-change-indicator.down {
  color: #ef4444;
}

.price-change-indicator.stable {
  color: #6b7280;
}

.trend-icon {
  font-size: 20px;
}

.trend-details {
  display: flex;
  flex-direction: column;
}

.trend-text {
  font-size: 12px;
  font-weight: 500;
}

.trend-change {
  font-size: 11px;
  opacity: 0.9;
}

/* Price Chart */
.price-chart {
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-header h3 {
  margin: 0;
  font-size: 14px;
  color: #1f2937;
}

.dark .chart-header h3 {
  color: white;
}

.chart-interval {
  font-size: 10px;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.5);
  padding: 2px 8px;
  border-radius: 12px;
}

.dark .chart-interval {
  background: rgba(0, 0, 0, 0.3);
}

.chart-container {
  display: flex;
  gap: 10px;
  height: 200px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 15px;
}

.dark .chart-container {
  background: rgba(0, 0, 0, 0.2);
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 9px;
  color: #6b7280;
  padding-right: 10px;
  border-right: 1px solid #d1d5db;
  min-width: 60px;
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
  gap: 4px;
  height: 100%;
}

.chart-bar {
  width: 100%;
  background: #d4a373;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
  position: relative;
  min-height: 4px;
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
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 8px;
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
  font-size: 8px;
  color: #6b7280;
  transform: rotate(-45deg);
  white-space: nowrap;
}

/* Price Stats */
.price-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.dark .stat-card {
  background: rgba(0, 0, 0, 0.2);
}

.stat-label {
  display: block;
  font-size: 9px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 14px;
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
  font-size: 8px;
  color: #6b7280;
}

/* Price Alerts */
.price-alerts {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 12px;
}

.dark .price-alerts {
  background: rgba(0, 0, 0, 0.2);
}

.alerts-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
}

.dark .alerts-title {
  color: white;
}

.alert-icon {
  font-size: 14px;
}

.alerts-scroll {
  max-height: 100px;
  overflow-y: auto;
  padding-right: 4px;
}

.price-alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  background: white;
  border-radius: 4px;
  font-size: 10px;
}

.dark .price-alert-item {
  background: #374151;
}

.price-alert-item.positive {
  border-left: 3px solid #10b981;
}

.price-alert-item.negative {
  border-left: 3px solid #ef4444;
}

.price-alert-item.warning {
  border-left: 3px solid #f59e0b;
}

.alert-time {
  font-weight: 600;
  color: #6b7280;
  min-width: 35px;
}

.alert-message {
  flex: 1;
  color: #1f2937;
}

.dark .alert-message {
  color: white;
}

.alert-change {
  font-weight: 600;
  min-width: 60px;
  text-align: right;
}

.alert-change.positive {
  color: #10b981;
}

.alert-change.negative {
  color: #ef4444;
}

/* Alert Cards (Telegram Tab) */
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

.dark .loading-state {
  background: #1f2937;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  border: 3px solid #f3f4f6;
  border-top-color: #fbbf24;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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
@media (max-width: 1024px) {
  .price-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .vps-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

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
  
  .price-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .vps-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .gold-price-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .gold-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .price-change-indicator {
    width: 100%;
  }
  
  .chart-container {
    flex-direction: column;
    height: auto;
  }
  
  .chart-y-axis {
    flex-direction: row;
    border-right: none;
    border-bottom: 1px solid #d1d5db;
    padding-right: 0;
    padding-bottom: 10px;
    width: 100%;
  }
  
  .chart-bars {
    height: 150px;
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
}

@media (max-width: 480px) {
  .price-value {
    font-size: 36px;
  }
  
  .price-stats {
    grid-template-columns: 1fr;
  }
  
  .vps-stats {
    grid-template-columns: 1fr;
  }
  
  .price-change-indicator {
    padding: 10px;
  }
  
  .trend-details {
    font-size: 10px;
  }
  
  .alert-card {
    flex-direction: column;
  }
  
  .alert-icon {
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
</style>