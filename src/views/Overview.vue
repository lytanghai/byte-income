<template>
  <div class="overview-page">
    <!-- Header -->
    <div class="page-header">
      <h1>Overview</h1>
      <p class="subtitle">Summary of your trading activities and market insights</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadCacheData" class="btn-retry">Retry</button>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon profit">📊</div>
          <div class="card-content">
            <span class="card-label">Net P&L</span>
            <span class="card-value" :class="getPnLClass(summaryData.netPnL)">
              ¢{{ (summaryData.netPnL / 100).toFixed(2)}} ≃ ${{summaryData.netPnL}} 
            </span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <span class="card-label">Win Rate</span>
            <span class="card-value">{{ summaryData.winRate }}%</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">🔄</div>
          <div class="card-content">
            <span class="card-label">Total Transactions</span>
            <span class="card-value">{{ summaryData.totalTrades }}</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">📰</div>
          <div class="card-content">
            <span class="card-label">News Articles</span>
            <span class="card-value">{{ summaryData.newsCount }}</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">📅</div>
          <div class="card-content">
            <span class="card-label">Events Today</span>
            <span class="card-value">{{ summaryData.eventsToday }}</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">🔔</div>
          <div class="card-content">
            <span class="card-label">Unread Alerts</span>
            <span class="card-value">{{ summaryData.unreadAlerts }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="stats-grid">
        <!-- Performance Stats -->
        <div class="stat-card performance">
          <div class="stat-header">
            <h3>Performance</h3>
            <span class="stat-updated">Last 30 days</span>
          </div>
          <div class="stat-body">
            <div class="stat-row">
              <span class="stat-name">Profit Days</span>
              <span class="stat-value profit">{{ summaryData.performance?.profitDays || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Loss Days</span>
              <span class="stat-value loss">{{ summaryData.performance?.lossDays || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Best Day</span>
              <span class="stat-value profit">¢{{ (summaryData.performance?.bestDay) }} ≃ ${{ (summaryData.performance?.bestDay / 100).toFixed(2) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Worst Day</span>
              <span class="stat-value loss">¢{{ summaryData.performance?.worstDay }} ≃ ${{(summaryData.performance?.worstDay / 100).toFixed(2)}} </span>
            </div>
          </div>
        </div>

        <!-- Transaction Stats -->
        <div class="stat-card transactions">
          <div class="stat-header">
            <h3>Transactions</h3>
            <span class="stat-updated">Last 30 days</span>
          </div>
          <div class="stat-body">
            <div class="stat-row">
              <span class="stat-name">Total Profit</span>
              <span class="stat-value profit">¢{{ summaryData.transactions?.totalProfit }} ≃ ${{ (summaryData.transactions?.totalProfit / 100).toFixed(2) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Total Loss</span>
              <span class="stat-value loss">¢{{ summaryData.transactions?.totalLoss }} ≃ ${{ (summaryData.transactions?.totalLoss).toFixed(2) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Deposits</span>
              <span class="stat-value">{{ formatCurrency(summaryData.transactions?.totalDeposit / 100) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Withdrawals</span>
              <span class="stat-value">{{ formatCurrency(summaryData.transactions?.totalWithdrawal / 100) }}</span>
            </div>
          </div>
        </div>

        <!-- Market Stats -->
        <div class="stat-card market">
          <div class="stat-header">
            <h3>Market</h3>
            <span class="stat-updated">Real-time</span>
          </div>
          <div class="stat-body">
            <div class="stat-row">
              <span class="stat-name">Gold (XAU)</span>
              <span class="stat-value">{{ formatPrice(summaryData.market?.gold) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Dollar Index</span>
              <span class="stat-value">{{ formatDxyPrice(summaryData.market?.dxy) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Gold Change</span>
              <span class="stat-value" :class="getChangeClass(summaryData.market?.goldChange)">
                {{ formatChange(summaryData.market?.goldChange) }}
              </span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Last Update</span>
              <span class="stat-value">{{ summaryData.market?.lastUpdate || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Insight Stats -->
        <div class="stat-card insight">
          <div class="stat-header">
            <h3>Insights</h3>
            <span class="stat-updated">{{ summaryData.insight?.period || 'Today' }}</span>
          </div>
          <div class="stat-body">
            <div class="stat-row">
              <span class="stat-name">High Impact Events</span>
              <span class="stat-value">{{ summaryData.insight?.highImpact || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">News Articles</span>
              <span class="stat-value">{{ summaryData.insight?.newsCount || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Top Category</span>
              <span class="stat-value">{{ summaryData.insight?.topCategory || 'N/A' }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Top Source</span>
              <span class="stat-value">{{ summaryData.insight?.topSource || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Recent Transactions Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Recent Transactions</h3>
            <span class="chart-badge">Last 7 days</span>
          </div>
          <div class="chart-body">
            <div v-if="recentTransactions.length === 0" class="no-chart-data">
              No recent transactions
            </div>
            <div v-else class="transaction-list">
              <div v-for="tx in recentTransactions" :key="tx.sn" class="transaction-item">
                <div class="tx-info">
                  <span class="tx-symbol">{{ tx.symbol }}</span>
                  <span class="tx-type" :class="tx.type.toLowerCase()">{{ tx.type }}</span>
                </div>
                <span class="tx-amount" :class="tx.type.toLowerCase()">
                  ¢{{ (tx.pnl / 100).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top News -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Top News</h3>
            <span class="chart-badge">Latest</span>
          </div>
          <div class="chart-body">
            <div v-if="topNews.length === 0" class="no-chart-data">
              No news available
            </div>
            <div v-else class="news-list">
              <div v-for="(news, idx) in topNews" :key="idx" class="news-item">
                <div class="news-source" :class="getSourceClass(news.source)">
                  {{ news.source }}
                </div>
                <div class="news-title">{{ truncateText(news.title, 50) }}</div>
                <div class="news-meta">
                  <span class="news-impact" :class="news.impact?.toLowerCase()">{{ news.impact }}</span>
                  <span class="news-time">{{ formatTimeAgo(news.published_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Upcoming Events</h3>
            <span class="chart-badge">Next 24h</span>
          </div>
          <div class="chart-body">
            <div v-if="upcomingEvents.length === 0" class="no-chart-data">
              No upcoming events
            </div>
            <div v-else class="events-list">
              <div v-for="event in upcomingEvents" :key="event.date + event.title" class="event-item">
                <div class="event-time">{{ formatEventTimeSimple(event.date) }}</div>
                <div class="event-info">
                  <span class="event-country">{{ event.country }}</span>
                  <span class="event-impact" :class="event.impact?.toLowerCase()">{{ event.impact }}</span>
                </div>
                <div class="event-title">{{ truncateText(event.title, 30) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cache Info -->
      <div class="cache-info">
        <div class="cache-info-header">
          <span class="cache-icon">💾</span>
          <span>Data Source: Browser Cache</span>
          <span class="cache-time">Last updated: {{ formatLastUpdated }}</span>
        </div>
        <button @click="refreshCache" class="btn-refresh-cache">
          <span class="refresh-icon" :class="{ 'spin': refreshing }">↻</span>
          Refresh Cache
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useNotification } from '../composables/useNotification'
import { useCache } from '../composables/useCache'

const { getCache } = useCache()

const notification = useNotification()

// State
const loading = ref(true)
const refreshing = ref(false)
const error = ref(null)

// Cache data
const cacheData = reactive({
  transactions: [],
  performance: null,
  market: {
    gold: null,
    dxy: null,
    goldChange: null,
    lastUpdate: null
  },
  insight: {
    news: [],
    events: []
  },
  notifications: []
})

// ============== LOAD CACHE DATA ==============
const loadCacheData = () => {
  loading.value = true
  error.value = null

  try {
    // Load Transaction Cache
    loadTransactionCache()
    
    // Load Performance Cache
    loadPerformanceCache()
    
    // Load Market Cache
    loadMarketCache()
    
    // Load Insight Cache
    loadInsightCache()
    
    // Load Notification Cache
    loadNotificationCache()

    console.log('✅ Dashboard data loaded from cache')
  } catch (err) {
    error.value = 'Failed to load dashboard data from cache'
    console.error('Error loading cache:', err)
  } finally {
    loading.value = false
  }
}

const refreshCache = () => {
  refreshing.value = true
  loadCacheData()
  setTimeout(() => {
    refreshing.value = false
    notification.success('Cache refreshed successfully')
  }, 500)
}

// ============== TRANSACTION CACHE ==============
const loadTransactionCache = () => {
  try {
    const cached = getCache('transaction_cache')
    if (cached) {
      cacheData.transactions = JSON.parse(cached)
    }
  } catch (err) {
    console.error('Failed to load transaction cache:', err)
  }
}

// ============== PERFORMANCE CACHE ==============
const loadPerformanceCache = () => {
  try {
    const cached = getCache('performance_calendar_cache')
    if (cached) {
      const data = JSON.parse(cached)
      cacheData.performance = data.data
    }
  } catch (err) {
    console.error('Failed to load performance cache:', err)
  }
}

// ============== MARKET CACHE ==============
const loadMarketCache = () => {
  try {
    // Try to get gold price from market page cache
    const goldData = getCache('gold_price_cache')
    if (goldData) {
      const data = JSON.parse(goldData)
      cacheData.market.gold = data.price
    }

    // Try to get DXY from market page cache
    const dxyData = getCache('dxy_price_cache')
    if (dxyData) {
      const data = JSON.parse(dxyData)
      cacheData.market.dxy = data.price
    }

    cacheData.market.lastUpdate = new Date().toLocaleTimeString()
  } catch (err) {
    console.error('Failed to load market cache:', err)
  }
}

// ============== INSIGHT CACHE ==============
const loadInsightCache = () => {
  try {
    // Load news
    const newsCached = getCache('insight_news_cache')
    if (newsCached) {
      const data = JSON.parse(newsCached)
      cacheData.insight.news = data.data || []
    }

    // Load events
    const eventsCached = getCache('insight_events_cache')
    if (eventsCached) {
      const data = JSON.parse(eventsCached)
      cacheData.insight.events = data.data || []
    }
  } catch (err) {
    console.error('Failed to load insight cache:', err)
  }
}

// ============== NOTIFICATION CACHE ==============
const loadNotificationCache = () => {
  try {
    const cached = getCache('notification_cache')
    if (cached) {
      cacheData.notifications = JSON.parse(cached)
    }
  } catch (err) {
    console.error('Failed to load notification cache:', err)
  }
}

// ============== COMPUTED SUMMARY ==============
const summaryData = computed(() => {
  const transactions = cacheData.transactions || []
  const performance = cacheData.performance
  const news = cacheData.insight.news || []
  const events = cacheData.insight.events || []
  const notifications = cacheData.notifications || []

  // Calculate transaction summary
  const profitTxs = transactions.filter(t => t.type === 'PROFIT')
  const lossTxs = transactions.filter(t => t.type === 'LOSS')
  const depositTxs = transactions.filter(t => t.type === 'DEPOSIT')
  const withdrawalTxs = transactions.filter(t => t.type === 'WITHDRAWAL')

  const totalProfit = profitTxs.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const totalLoss = lossTxs.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const totalDeposit = depositTxs.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const totalWithdrawal = withdrawalTxs.reduce((sum, t) => sum + (t.pnl || 0), 0)

  // Calculate win rate
  const totalTrades = profitTxs.length + lossTxs.length
  const winRate = totalTrades > 0 
    ? ((profitTxs.length / totalTrades) * 100).toFixed(1)
    : 0

  // Calculate news stats
  const highImpactNews = news.filter(n => n.impact === 'HIGH' || n.impact === 'High').length
  const categories = news.map(n => n.category).filter(Boolean)
  const topCategory = getMostFrequent(categories)
  const sources = news.map(n => n.source).filter(Boolean)
  const topSource = getMostFrequent(sources)

  // Calculate events for today
  const today = new Date()
  const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
  const eventsToday = events.filter(e => e.date?.startsWith(todayStr)).length

  // Unread notifications
  const unreadAlerts = notifications.filter(n => !n.has_read).length

  return {
    // Overall
    netPnL: totalProfit - totalLoss,
    winRate,
    totalTrades,
    newsCount: news.length,
    eventsToday,
    unreadAlerts,

    // Performance
    performance: performance ? {
      profitDays: performance.days?.filter(d => d.pnl > 0).length || 0,
      lossDays: performance.days?.filter(d => d.pnl < 0).length || 0,
      bestDay: Math.max(...(performance.days?.map(d => d.pnl) || [0])),
      worstDay: Math.min(...(performance.days?.map(d => d.pnl) || [0]))
    } : null,

    // Transactions
    transactions: {
      totalProfit,
      totalLoss,
      totalDeposit,
      totalWithdrawal
    },

    // Market
    market: {
      gold: cacheData.market.gold,
      dxy: cacheData.market.dxy,
      goldChange: cacheData.market.goldChange,
      lastUpdate: cacheData.market.lastUpdate
    },

    // Insight
    insight: {
      highImpact: highImpactNews,
      newsCount: news.length,
      topCategory: topCategory || 'N/A',
      topSource: topSource || 'N/A',
      period: 'Last 7 days'
    }
  }
})

// Recent transactions (last 5)
const recentTransactions = computed(() => {
  return (cacheData.transactions || [])
    .slice(0, 5)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Top news (last 3)
const topNews = computed(() => {
  return (cacheData.insight.news || [])
    .slice(0, 3)
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
})

// Upcoming events (next 3)
const upcomingEvents = computed(() => {
  const now = new Date()
  return (cacheData.insight.events || [])
    .filter(e => {
      const eventDate = parseEventDate(e.date)
      return eventDate > now
    })
    .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date))
    .slice(0, 3)
})

// Format last updated
const formatLastUpdated = computed(() => {
  return new Date().toLocaleString()
})

// ============== HELPER FUNCTIONS ==============
const getMostFrequent = (arr) => {
  if (!arr.length) return null
  const frequency = {}
  let maxFreq = 0
  let mostFrequent = null

  for (const item of arr) {
    frequency[item] = (frequency[item] || 0) + 1
    if (frequency[item] > maxFreq) {
      maxFreq = frequency[item]
      mostFrequent = item
    }
  }
  return mostFrequent
}

const parseEventDate = (dateStr) => {
  if (!dateStr) return new Date(0)
  const [datePart] = dateStr.split(' ')
  const [day, month, year] = datePart.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

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

const formatChange = (change) => {
  if (change === undefined || change === null) return '0.00'
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}`
}

const formatTimeAgo = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return `${Math.floor(diffMins / 1440)}d ago`
}

const formatEventTimeSimple = (dateTime) => {
  if (!dateTime) return 'All Day'
  const [, time] = dateTime.split(' ')
  if (!time) return 'All Day'
  
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const getPnLClass = (value) => {
  if (value > 0) return 'profit'
  if (value < 0) return 'loss'
  return ''
}

const getChangeClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return ''
}

const getSourceClass = (source) => {
  return source?.toLowerCase().replace(/\s+/g, '-') || ''
}

// Initialize
onMounted(() => {
  loadCacheData()
})
</script>

<style scoped>
  @import '../assets/styles/overview.css';
</style>