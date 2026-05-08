<template>
  <div class="performance-page">
    <div class="page-header">
      <h1>Performance</h1>
      <p class="subtitle">Profit/Loss Calendar & Transaction History</p>
    </div>

    <!-- Month/Year Selector & Recovery Button -->
    <div class="calendar-controls">
      <div class="date-selector">
        <select v-model="selectedMonth" @change="fetchMonthlyPerformance" class="month-select">
          <option v-for="month in months" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
        <select v-model="selectedYear" @change="fetchMonthlyPerformance" class="year-select">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <!-- Recovery Phase Button -->
      <button @click="showRecoveryPopup" class="recovery-btn" :disabled="recoveryLoading">
        <span v-if="recoveryLoading" class="btn-spinner"></span>
        <span v-else>🔄 Recovery Phase</span>
      </button>

      <div class="summary-stats" v-if="monthlyStats">
        <div class="stat-card">
          <span class="stat-label">Total P&L</span>
          <span class="stat-value" :class="getPnLClass(monthlyStats.totalPnL)">
            ${{ formatMoney((monthlyStats.totalPnL / 100).toFixed(2)) }}
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Profit Days</span>
          <span class="stat-value profit">{{ monthlyStats.profitDays }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Loss Days</span>
          <span class="stat-value loss">{{ monthlyStats.lossDays }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Best Day</span>
          <span class="stat-value profit">${{ formatMoney((monthlyStats.bestDay / 100).toFixed(2)) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Worst Day</span>
          <span class="stat-value loss">${{ formatMoney((monthlyStats.worstDay / 100).toFixed(2)) }}</span>
        </div>
      </div>
    </div>

    <!-- Streak Cards -->
    <div class="streak-cards" v-if="streakStats">
      <div class="streak-card">
        <div class="streak-icon winning">🔥</div>
        <div class="streak-content">
          <span class="streak-label">Current Win Streak</span>
          <span class="streak-value winning">{{ streakStats.currentWinStreak }} day{{ streakStats.currentWinStreak !== 1 ? 's' : '' }}</span>
          <span class="streak-dates" v-if="streakStats.currentWinStart && streakStats.currentWinEnd">
            {{ formatDateShort(streakStats.currentWinStart) }} - {{ formatDateShort(streakStats.currentWinEnd) }}
          </span>
        </div>
      </div>

      <div class="streak-card">
        <div class="streak-icon losing">💔</div>
        <div class="streak-content">
          <span class="streak-label">Current Loss Streak</span>
          <span class="streak-value losing">{{ streakStats.currentLossStreak }} day{{ streakStats.currentLossStreak !== 1 ? 's' : '' }}</span>
          <span class="streak-dates" v-if="streakStats.currentLossStart && streakStats.currentLossEnd">
            {{ formatDateShort(streakStats.currentLossStart) }} - {{ formatDateShort(streakStats.currentLossEnd) }}
          </span>
        </div>
      </div>

      <div class="streak-card">
        <div class="streak-icon record">🏆</div>
        <div class="streak-content">
          <span class="streak-label">Longest Win Streak</span>
          <span class="streak-value record">{{ streakStats.longestWinStreak }} day{{ streakStats.longestWinStreak !== 1 ? 's' : '' }}</span>
          <span class="streak-dates" v-if="streakStats.longestWinStart && streakStats.longestWinEnd">
            {{ formatDateShort(streakStats.longestWinStart) }} - {{ formatDateShort(streakStats.longestWinEnd) }}
          </span>
        </div>
      </div>

      <div class="streak-card">
        <div class="streak-icon worst">📉</div>
        <div class="streak-content">
          <span class="streak-label">Longest Loss Streak</span>
          <span class="streak-value worst">{{ streakStats.longestLossStreak }} day{{ streakStats.longestLossStreak !== 1 ? 's' : '' }}</span>
          <span class="streak-dates" v-if="streakStats.longestLossStart && streakStats.longestLossEnd">
            {{ formatDateShort(streakStats.longestLossStart) }} - {{ formatDateShort(streakStats.longestLossEnd) }}
          </span>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- Left Column - Calendar -->
      <div class="calendar-section">
        <div class="section-header">
          <h2>Monthly P&L Calendar</h2>
          <div class="legend">
            <span class="legend-item profit">Profit</span>
            <span class="legend-item loss">Loss</span>
            <span class="legend-item neutral">No Trade</span>
          </div>
        </div>

        <div v-if="calendarLoading" class="loading-state small">
          <div class="spinner-small"></div>
          <p>Loading calendar...</p>
        </div>

        <div v-else-if="calendarError" class="error-state small">
          <p class="error-message">{{ calendarError }}</p>
          <button @click="fetchMonthlyPerformance" class="btn-retry">Retry</button>
        </div>

        <div v-else class="calendar-grid">
          <div class="weekdays">
            <span v-for="day in weekdays" :key="day">{{ day }}</span>
          </div>
          
          <div v-for="n in startDayOffset" :key="'empty-'+n" class="calendar-day empty"></div>
          
          <div v-for="day in calendarDays" :key="day.day" class="calendar-day" :class="getDayClass(day)" @click="selectDay(day)">
            <span class="day-number">{{ day.day }}</span>
            <span class="day-pnl">¢{{ formatMoney(day.pnl) }}</span>
          </div>
        </div>

        <div class="mobile-summary-stats mobile-only" v-if="monthlyStats">
          <div class="mobile-stats-grid">
            <div class="mobile-stat-item">
              <span class="mobile-stat-label">Best Day</span>
              <span class="mobile-stat-value profit">¢{{ formatMoney(monthlyStats.bestDay.toFixed(2)) }}</span>
            </div>
            <div class="mobile-stat-item">
              <span class="mobile-stat-label">Worst Day</span>
              <span class="mobile-stat-value loss">¢{{ formatMoney(monthlyStats.worstDay.toFixed(2)) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Transactions -->
      <div class="transactions-section">
        <div class="section-header">
          <h2>Transaction History</h2>
          <button class="filter-toggle mobile-only" @click="toggleFilters" v-if="!showFilters">
            <span class="filter-icon">🔍</span>
            <span style="color:#000"> Filters </span>
          </button>
        </div>

        <div class="transaction-filters" :class="{ 'show': showFilters }">
          <div class="filters-header mobile-only">
            <h3>Filter Transactions</h3>
            <button class="close-filters" @click="toggleFilters">✕</button>
          </div>
          
          <select v-model="transactionFilter.type" @change="fetchTransactions" class="filter-select">
            <option value="">All Types</option>
            <option value="PROFIT">Profit</option>
            <option value="LOSS">Loss</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
          </select>
          
          <select v-model="transactionFilter.currency" @change="fetchTransactions" class="filter-select">
            <option value="">All Currencies</option>
            <option value="USDC">USDC</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>

          <div class="search-wrapper">
            <input v-model="transactionFilter.symbol" @input="debouncedFetchTransactions" placeholder="Search symbol..." class="filter-input" />
            <span class="search-icon">🔍</span>
          </div>

          <button class="clear-filters mobile-only" @click="clearFilters" v-if="hasActiveFilters">
            Clear Filters
          </button>
        </div>

        <div v-if="selectedDay" class="selected-day-info">
          <div class="selected-day-left">
            <h3>{{ formatSelectedDate(selectedDay) }}</h3>
          </div>
          <span class="day-total" :class="getPnLClass(selectedDay.pnl)">
            {{ formatCurrency(selectedDay.pnl) }}
          </span>
        </div>

        <div v-if="transactionsLoading && transactions.length === 0" class="loading-state small">
          <div class="spinner-small"></div>
          <p>Loading transactions...</p>
        </div>

        <div v-else-if="transactionsError" class="error-state small">
          <p class="error-message">{{ transactionsError }}</p>
          <button @click="fetchTransactions(true)" class="btn-retry">Retry</button>
        </div>

        <div v-else class="transactions-list">
          <div v-if="transactions.length === 0" class="no-data">
            No transactions found for this period
          </div>
          
          <div v-for="transaction in transactions" :key="transaction.id" class="transaction-card" :class="transaction.type?.toLowerCase()">
            <div class="transaction-header">
              <div class="transaction-left">
                <span class="transaction-type">{{ transaction.type }}</span>
                <span class="transaction-symbol">{{ transaction.symbol || '—' }}</span>
              </div>
              <span class="transaction-date">{{ formatTransactionDate(transaction.date) }}</span>
            </div>
            
            <div class="transaction-details">
              <div class="detail-row">
                <div class="detail-item">
                  <span class="detail-label">{{ getAmountLabel(transaction.type) }}</span>
                  <span class="detail-value amount" :class="getAmountClass(transaction)">
                    {{ formatTransactionAmount(transaction) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="hasMoreTransactions" class="load-more">
            <button @click="loadMoreTransactions" class="btn-load-more" :disabled="transactionsLoading">
              {{ transactionsLoading ? 'Loading...' : 'Load More Transactions' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recovery Phase Modal -->
    <div v-if="showRecoveryModal" class="modal-overlay" @click.self="closeRecoveryModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>💰 Recovery Phase Progress</h2>
          <button class="modal-close" @click="closeRecoveryModal">✕</button>
        </div>

        <div v-if="recoveryLoading" class="modal-loading">
          <div class="spinner"></div>
          <p>Calculating recovery data...</p>
        </div>

        <div v-else-if="recoveryError" class="modal-error">
          <p class="error-message">{{ recoveryError }}</p>
          <button @click="fetchRecoveryData" class="btn-retry">Retry</button>
        </div>

        <div v-else-if="recoveryData" class="modal-body">
          <div class="progress-circle-container">
            <div class="progress-circle" :style="{ background: `conic-gradient(#10b981 0deg ${recoveryPercentageDeg}deg, #e5e7eb ${recoveryPercentageDeg}deg 360deg)` }">
              <div class="progress-inner">
                <span class="progress-percentage">{{ recoveryData.recoveryPercentage.toFixed(1) }}%</span>
                <span class="progress-label">Recovered</span>
              </div>
            </div>
          </div>

          <div class="recovery-stats">
            <div class="recovery-stat-card">
              <span class="stat-icon">💸</span>
              <div class="stat-info">
                <span class="stat-label">Total Debt</span>
                <span class="stat-value debt">{{ formatCurrency(recoveryData.totalDebt) }}</span>
              </div>
            </div>

            <div class="recovery-stat-card">
              <span class="stat-icon">📈</span>
              <div class="stat-info">
                <span class="stat-label">Total Profit</span>
                <span class="stat-value profit">{{ formatCurrency(recoveryData.totalProfit) }}</span>
              </div>
            </div>

            <div class="recovery-stat-card">
              <span class="stat-icon">📉</span>
              <div class="stat-info">
                <span class="stat-label">Total Loss</span>
                <span class="stat-value loss">{{ formatCurrency(recoveryData.totalLoss) }}</span>
              </div>
            </div>

            <div class="recovery-stat-card">
              <span class="stat-icon">✅</span>
              <div class="stat-info">
                <span class="stat-label">Recovered Amount</span>
                <span class="stat-value recovered">{{ formatCurrency(recoveryData.recoveredAmount) }}</span>
              </div>
            </div>

            <div class="recovery-stat-card">
              <span class="stat-icon">⏳</span>
              <div class="stat-info">
                <span class="stat-label">Remaining Debt</span>
                <span class="stat-value remaining">{{ formatCurrency(recoveryData.remainingDebt) }}</span>
              </div>
            </div>
          </div>

          <div class="progress-bar-container">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: recoveryData.recoveryPercentage + '%' }"></div>
            </div>
            <div class="progress-bar-labels">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div class="status-message" :class="getStatusClass()">
            <span class="status-icon">{{ getStatusIcon() }}</span>
            <span class="status-text">{{ getStatusMessage() }}</span>
          </div>

          <div class="modal-actions">
            <button @click="closeRecoveryModal" class="btn-close">Close</button>
            <button @click="fetchRecoveryData" class="btn-refresh" :disabled="recoveryLoading">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useNotification } from '../composables/useNotification'
import { useCache } from '../composables/useCache'
import { formatMoney } from '../services/util'

const { setCache, getCache } = useCache()

const saveCacheData = (cacheName, data) => {
  setCache(cacheName, data, 5)
}

const notification = useNotification()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const CALENDAR_CACHE_KEY = 'performance_calendar_cache'
const CALENDAR_TIMESTAMP_KEY = 'performance_calendar_timestamp'
const TRANSACTIONS_CACHE_KEY = 'performance_transactions_cache'
const TRANSACTIONS_TIMESTAMP_KEY = 'performance_transactions_timestamp'

// State
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const selectedDay = ref(null)
const showFilters = ref(false)

// Calendar data
const calendarData = ref(null)
const calendarLoading = ref(false)
const calendarError = ref(null)

// Transactions data
const transactions = ref([])
const transactionsLoading = ref(false)
const transactionsError = ref(null)
const currentTransactionPage = ref(0)
const hasMoreTransactions = ref(true)
const totalTransactionElements = ref(0)

// Filters
const transactionFilter = reactive({
  type: '',
  currency: '',
  symbol: '',
  page: '0',
  size: '10'
})

// Recovery Phase State
const showRecoveryModal = ref(false)
const recoveryLoading = ref(false)
const recoveryError = ref(null)
const recoveryData = ref(null)

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const currentYear = new Date().getFullYear()
const years = computed(() => {
  const years = []
  for (let i = currentYear - 1; i <= currentYear + 5; i++) {
    years.push(i)
  }
  return years
})

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const recoveryPercentageDeg = computed(() => {
  if (!recoveryData.value) return 0
  const percentage = Math.min(recoveryData.value.recoveryPercentage, 100)
  return (percentage / 100) * 360
})

const startDayOffset = computed(() => {
  if (!calendarData.value) return 0
  const firstDay = new Date(calendarData.value.year, calendarData.value.month - 1, 1)
  return firstDay.getDay()
})

const calendarDays = computed(() => {
  return calendarData.value?.days || []
})

const monthlyStats = computed(() => {
  if (!calendarData.value?.days) return null
  const days = calendarData.value.days
  const totalPnL = days.reduce((sum, day) => sum + day.pnl, 0)
  const profitDays = days.filter(day => day.pnl > 0).length
  const lossDays = days.filter(day => day.pnl < 0).length
  const bestDay = Math.max(...days.map(day => day.pnl))
  const worstDay = Math.min(...days.map(day => day.pnl))
  return { totalPnL, profitDays, lossDays, bestDay, worstDay }
})

const streakStats = computed(() => {
  if (!calendarData.value?.days) return null
  const days = calendarData.value.days
  const sortedDays = [...days].sort((a, b) => a.day - b.day)
  let currentWinStreak = 0, currentLossStreak = 0, longestWinStreak = 0, longestLossStreak = 0
  let currentWinStart = null, currentWinEnd = null, currentLossStart = null, currentLossEnd = null
  let longestWinStart = null, longestWinEnd = null, longestLossStart = null, longestLossEnd = null
  let ongoingWinStreak = 0, ongoingLossStreak = 0, ongoingWinStart = null, ongoingLossStart = null
  let lastNonNeutralResult = null

  for (let i = 0; i < sortedDays.length; i++) {
    const day = sortedDays[i]
    if (day.pnl > 0) {
      if (lastNonNeutralResult === 'win') {
        ongoingWinStreak++
      } else {
        ongoingWinStreak = 1
        ongoingWinStart = day.day
      }
      ongoingLossStreak = 0
      ongoingLossStart = null
      lastNonNeutralResult = 'win'
      currentWinStreak = ongoingWinStreak
      currentWinEnd = day.day
      currentWinStart = ongoingWinStart
      currentLossStreak = 0
      currentLossStart = null
      currentLossEnd = null
      if (ongoingWinStreak > longestWinStreak) {
        longestWinStreak = ongoingWinStreak
        longestWinStart = ongoingWinStart
        longestWinEnd = day.day
      }
    } else if (day.pnl < 0) {
      if (lastNonNeutralResult === 'loss') {
        ongoingLossStreak++
      } else {
        ongoingLossStreak = 1
        ongoingLossStart = day.day
      }
      ongoingWinStreak = 0
      ongoingWinStart = null
      lastNonNeutralResult = 'loss'
      currentLossStreak = ongoingLossStreak
      currentLossEnd = day.day
      currentLossStart = ongoingLossStart
      currentWinStreak = 0
      currentWinStart = null
      currentWinEnd = null
      if (ongoingLossStreak > longestLossStreak) {
        longestLossStreak = ongoingLossStreak
        longestLossStart = ongoingLossStart
        longestLossEnd = day.day
      }
    }
  }
  return {
    currentWinStreak, currentLossStreak, longestWinStreak, longestLossStreak,
    currentWinStart, currentWinEnd, currentLossStart, currentLossEnd,
    longestWinStart, longestWinEnd, longestLossStart, longestLossEnd
  }
})

const hasActiveFilters = computed(() => {
  return transactionFilter.type || transactionFilter.currency || transactionFilter.symbol
})

// Helper Functions
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDateShort = (day) => {
  if (!day || !calendarData.value) return ''
  const date = new Date(calendarData.value.year, calendarData.value.month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatTransactionDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date >= today) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  } else if (date >= yesterday) {
    return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
}

const formatSelectedDate = (day) => {
  if (!day || !calendarData.value) return ''
  const date = new Date(calendarData.value.year, calendarData.value.month - 1, day.day)
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const getAmountLabel = (type) => {
  if (type === 'PROFIT' || type === 'LOSS') return 'P&L'
  if (type === 'DEPOSIT') return 'Deposit'
  if (type === 'WITHDRAWAL') return 'Withdrawal'
  return 'Amount'
}

const getAmountClass = (transaction) => {
  if (!transaction || !transaction.type) return ''
  if (transaction.type === 'PROFIT' || transaction.type === 'DEPOSIT') return 'profit'
  if (transaction.type === 'LOSS' || transaction.type === 'WITHDRAWAL') return 'loss'
  return ''
}

const formatTransactionAmount = (transaction) => {
  if (!transaction) return '-'
  const amount = transaction.amount || transaction.pnl || transaction.value || 0
  if (transaction.type === 'PROFIT' || transaction.type === 'LOSS') {
    return '¢' + formatMoney(amount)
  }
  return ` ${formatCurrency(amount)}`
}

const getPnLClass = (value) => {
  if (value > 0) return 'profit'
  if (value < 0) return 'loss'
  return ''
}

const getDayClass = (day) => {
  if (day.pnl > 0) return 'profit-day'
  if (day.pnl < 0) return 'loss-day'
  return 'neutral-day'
}

const selectDay = (day) => {
  selectedDay.value = day
  fetchTransactions(true)
  showFilters.value = false
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const clearFilters = () => {
  transactionFilter.type = ''
  transactionFilter.currency = ''
  transactionFilter.symbol = ''
  fetchTransactions(true)
  showFilters.value = false
}

const getAuthToken = () => {
  const authToken = localStorage.getItem('authToken')
  if (!authToken) {
    notification.error('No authentication token found')
    throw new Error('No authentication token found')
  }
  return authToken
}

const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Cache Functions
const saveCalendarToCache = (data) => {
  try {
    const cacheData = { data: data, month: selectedMonth.value, year: selectedYear.value }
    saveCacheData(CALENDAR_CACHE_KEY, JSON.stringify(cacheData), 10)
    saveCacheData(CALENDAR_TIMESTAMP_KEY, new Date().toISOString(), 10)
  } catch (err) {
    console.error('Failed to save calendar to cache:', err)
  }
}

const loadCalendarFromCache = () => {
  try {
    const cached = getCache(CALENDAR_CACHE_KEY)
    const timestamp = getCache(CALENDAR_TIMESTAMP_KEY)
    if (cached && timestamp) {
      const cacheData = JSON.parse(cached)
      if (cacheData.month === selectedMonth.value && cacheData.year === selectedYear.value) {
        calendarData.value = cacheData.data
        return true
      }
    }
  } catch (err) {
    console.error('Failed to load calendar from cache:', err)
  }
  return false
}

const saveTransactionsToCache = (data) => {
  try {
    const cacheKey = `${TRANSACTIONS_CACHE_KEY}_${selectedMonth.value}_${selectedYear.value}${selectedDay.value ? '_' + selectedDay.value.day : ''}`
    const cacheData = {
      data: data,
      page: currentTransactionPage.value,
      hasMore: hasMoreTransactions.value,
      total: totalTransactionElements.value,
      filters: {
        type: transactionFilter.type,
        currency: transactionFilter.currency,
        symbol: transactionFilter.symbol
      }
    }
    saveCacheData(cacheKey, JSON.stringify(cacheData), 10)
    saveCacheData(TRANSACTIONS_TIMESTAMP_KEY, new Date().toISOString(), 10)
  } catch (err) {
    console.error('Failed to save transactions to cache:', err)
  }
}

const loadTransactionsFromCache = () => {
  try {
    const cacheKey = `${TRANSACTIONS_CACHE_KEY}_${selectedMonth.value}_${selectedYear.value}${selectedDay.value ? '_' + selectedDay.value.day : ''}`
    const cached = getCache(cacheKey)
    if (cached) {
      const cacheData = JSON.parse(cached)
      if (cacheData.filters.type === transactionFilter.type &&
          cacheData.filters.currency === transactionFilter.currency &&
          cacheData.filters.symbol === transactionFilter.symbol) {
        transactions.value = cacheData.data
        currentTransactionPage.value = cacheData.page
        hasMoreTransactions.value = cacheData.hasMore
        totalTransactionElements.value = cacheData.total
        return true
      }
    }
  } catch (err) {
    console.error('Failed to load transactions from cache:', err)
  }
  return false
}

// API Calls
const fetchMonthlyPerformance = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const loaded = loadCalendarFromCache()
    if (loaded) {
      fetchTransactions(true)
      return
    }
  }
  calendarLoading.value = true
  calendarError.value = null
  try {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/transaction/monthly/performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ month: selectedMonth.value, year: selectedYear.value })
    })
    const data = await response.json()
    if (data.code === '200') {
      calendarData.value = data.data
      saveCalendarToCache(data.data)
      selectedDay.value = null
      fetchTransactions(true)
      notification.success(`Loaded data for ${months[selectedMonth.value - 1].label} ${selectedYear.value}`)
    } else {
      throw new Error(data.message || 'Failed to fetch calendar data')
    }
  } catch (err) {
    calendarError.value = err.message
    notification.error(err.message)
  } finally {
    calendarLoading.value = false
  }
}

const fetchTransactions = async (reset = true) => {
  if (reset) {
    const loaded = loadTransactionsFromCache()
    if (loaded) return
  }
  if (reset) {
    currentTransactionPage.value = 0
    transactions.value = []
  }
  transactionsLoading.value = true
  transactionsError.value = null
  try {
    const token = getAuthToken()
    const payload = { size: transactionFilter.size || '10', page: currentTransactionPage.value.toString() }
    if (transactionFilter.type) payload.type = transactionFilter.type
    if (transactionFilter.currency) payload.currency = transactionFilter.currency
    if (transactionFilter.symbol) payload.symbol = transactionFilter.symbol
    if (selectedDay.value && calendarData.value) {
      const year = calendarData.value.year
      const month = String(calendarData.value.month).padStart(2, '0')
      const day = String(selectedDay.value.day).padStart(2, '0')
      payload.date = `${year}-${month}-${day}`
    }
    const response = await fetch(`${API_BASE_URL}/transaction/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    if (data.code === '200') {
      if (reset) {
        transactions.value = data.data.content || []
      } else {
        transactions.value = [...transactions.value, ...(data.data.content || [])]
      }
      totalTransactionElements.value = data.data.total_element || 0
      hasMoreTransactions.value = transactions.value.length < totalTransactionElements.value
      saveTransactionsToCache(transactions.value)
      if (reset && transactions.value.length === 0) {
        notification.info('No transactions found for this period')
      }
    } else {
      throw new Error(data.message || 'Failed to fetch transactions')
    }
  } catch (err) {
    transactionsError.value = err.message
    notification.error(err.message)
  } finally {
    transactionsLoading.value = false
  }
}

const loadMoreTransactions = () => {
  if (hasMoreTransactions.value && !transactionsLoading.value) {
    currentTransactionPage.value++
    fetchTransactions(false)
  }
}

const debouncedFetchTransactions = debounce(() => {
  fetchTransactions(true)
}, 500)

// Recovery Phase Functions
// ============== RECOVERY API CALL ==============
const fetchRecoveryData = async () => {
  recoveryLoading.value = true
  recoveryError.value = null
  recoveryData.value = null

  try {
    const token = getAuthToken()
    console.log('Fetching recovery data from:', `${API_BASE_URL}/transaction/recovery-debt`)

    const response = await fetch(`${API_BASE_URL}/transaction/recovery-debt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    })

    const data = await response.json()
    console.log('Response data:', data)

    if (data.code === '200') {
      // Map snake_case from API to camelCase expected by template
      recoveryData.value = {
        totalDebt: data.data.total_debt,
        totalProfit: data.data.total_profit,
        totalLoss: data.data.total_loss,
        recoveredAmount: data.data.recovered_amount,
        remainingDebt: data.data.remaining_debt,
        recoveryPercentage: data.data.recovery_percentage
      }
      console.log('Mapped recovery data:', recoveryData.value)
      notification.success('Recovery data loaded successfully')
    } else {
      throw new Error(data.message || 'Failed to fetch recovery data')
    }
  } catch (err) {
    recoveryError.value = err.message
    console.error('Recovery API Error:', err)
    notification.error(err.message)
  } finally {
    recoveryLoading.value = false
  }
}

const showRecoveryPopup = async () => {
  showRecoveryModal.value = true
  await fetchRecoveryData()
}

const closeRecoveryModal = () => {
  showRecoveryModal.value = false
  recoveryData.value = null
  recoveryError.value = null
}

const getStatusClass = () => {
  if (!recoveryData.value) return ''
  const percentage = recoveryData.value.recoveryPercentage
  if (percentage >= 100) return 'status-success'
  if (percentage >= 75) return 'status-great'
  if (percentage >= 50) return 'status-good'
  if (percentage >= 25) return 'status-progress'
  return 'status-starting'
}

const getStatusIcon = () => {
  if (!recoveryData.value) return '📊'
  const percentage = recoveryData.value.recoveryPercentage
  if (percentage >= 100) return '🎉'
  if (percentage >= 75) return '🚀'
  if (percentage >= 50) return '💪'
  if (percentage >= 25) return '📈'
  return '🌟'
}

const getStatusMessage = () => {
  if (!recoveryData.value) return ''
  const percentage = recoveryData.value.recoveryPercentage
  const remaining = recoveryData.value.remainingDebt

  if (percentage >= 100) {
    return 'Congratulations! You have fully recovered your debt! 🎉'
  }
  if (percentage >= 75) {
    return `Excellent progress! Only ${formatCurrency(remaining)} remaining to reach full recovery.`
  }
  if (percentage >= 50) {
    return `More than halfway there! Keep going to recover the remaining ${formatCurrency(remaining)}.`
  }
  if (percentage >= 25) {
    return `Good start! Continue trading to recover ${formatCurrency(remaining)} more.`
  }
  return `Every journey begins with a first step. Start trading to recover ${formatCurrency(remaining)}!`
}

// Watchers
watch([() => transactionFilter.type, () => transactionFilter.currency], () => {
  fetchTransactions(true)
})

// Initialize
onMounted(() => {
  fetchMonthlyPerformance()
})
</script>

<style scoped>
@import '../assets/styles/performance.css';

/* Recovery Button Styles - Add these to your performance.css file */
.recovery-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
  height: 40px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.recovery-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.recovery-btn:active:not(:disabled) {
  transform: translateY(0);
}

.recovery-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal Styles - Add these to your performance.css file */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--bg-panel, white);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-main, #1f2937);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-loading,
.modal-error {
  text-align: center;
  padding: 60px 24px;
}

.modal-body {
  padding: 24px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin: 0 auto 16px;
}

.progress-circle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.progress-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.progress-inner {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: var(--bg-panel, white);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.progress-percentage {
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
  line-height: 1;
}

.progress-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
}

.recovery-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.recovery-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: transform 0.2s;
}

.recovery-stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 28px;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.6rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 700;
}

.stat-value.debt { color: #ef4444; }
.stat-value.profit { color: #10b981; }
.stat-value.loss { color: #ef4444; }
.stat-value.recovered { color: #3b82f6; }
.stat-value.remaining { color: #f59e0b; }

.progress-bar-container {
  margin-bottom: 24px;
}

.progress-bar-bg {
  background: #e5e7eb;
  border-radius: 20px;
  height: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar-fill {
  background: linear-gradient(90deg, #10b981, #34d399);
  height: 100%;
  border-radius: 20px;
  transition: width 0.5s ease;
}

.progress-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #6b7280;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  background: #f3f4f6;
}

.status-icon {
  font-size: 28px;
}

.status-text {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text-main, #1f2937);
}

.status-message.status-success {
  background: #d1fae5;
  border-left: 4px solid #10b981;
}

.status-message.status-great {
  background: #e0f2fe;
  border-left: 4px solid #3b82f6;
}

.status-message.status-good {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-close,
.btn-refresh {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-close {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-close:hover {
  background: #e5e7eb;
}

.btn-refresh {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .recovery-btn {
    width: 100%;
    min-width: auto;
  }
  
  .modal-content {
    max-width: 95%;
  }
  
  .recovery-stats {
    grid-template-columns: 1fr;
  }
  
  .progress-circle {
    width: 140px;
    height: 140px;
  }
  
  .progress-inner {
    width: 115px;
    height: 115px;
  }
  
  .progress-percentage {
    font-size: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .btn-close,
  .btn-refresh {
    width: 100%;
  }
}
</style>