<template>
  <div class="performance-page">
    <div class="page-header">
      <h1>Performance</h1>
      <p class="subtitle">Profit/Loss Calendar & Transaction History</p>
    </div>

    <!-- Month/Year Selector -->
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

        <!-- Loading state -->
        <div v-if="calendarLoading" class="loading-state small">
          <div class="spinner-small"></div>
          <p>Loading calendar...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="calendarError" class="error-state small">
          <p class="error-message">{{ calendarError }}</p>
          <button @click="fetchMonthlyPerformance" class="btn-retry">Retry</button>
        </div>

        <!-- Calendar Grid -->
        <div v-else class="calendar-grid">
          <div class="weekdays">
            <span v-for="day in weekdays" :key="day">{{ day }}</span>
          </div>
          
          <!-- Empty cells for days before month starts -->
          <div v-for="n in startDayOffset" :key="'empty-'+n" class="calendar-day empty"></div>
          
          <!-- Actual days -->
          <div 
            v-for="day in calendarDays" 
            :key="day.day"
            class="calendar-day"
            :class="getDayClass(day)"
            @click="selectDay(day)"
          >
            <span class="day-number">{{ day.day }}</span>
            <span class="day-pnl">¢{{ formatMoney(day.pnl) }}</span>
          </div>
        </div>

        <!-- Mobile summary stats (visible only on mobile) -->
        <div class="mobile-summary-stats mobile-only" v-if="monthlyStats">
          <div class="mobile-stats-grid">
            <div class="mobile-stat-item">
              <span class="mobile-stat-label">Best Day</span>
              <span class="mobile-stat-value profit">¢{{formatMoney(monthlyStats.bestDay.toFixed(2)) }}</span>
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

        <!-- Transaction Filters -->
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
            <input 
              v-model="transactionFilter.symbol" 
              @input="debouncedFetchTransactions"
              placeholder="Search symbol..."
              class="filter-input"
            />
            <span class="search-icon">🔍</span>
          </div>

          <button class="clear-filters mobile-only" @click="clearFilters" v-if="hasActiveFilters">
            Clear Filters
          </button>
        </div>

        <!-- Selected Day Info -->
        <div v-if="selectedDay" class="selected-day-info">
          <div class="selected-day-left">
            <h3>{{ formatSelectedDate(selectedDay) }}</h3>
          </div>
          <span class="day-total" :class="getPnLClass(selectedDay.pnl)">
            {{ formatCurrency(selectedDay.pnl) }}
          </span>
        </div>

        <!-- Loading state -->
        <div v-if="transactionsLoading && transactions.length === 0" class="loading-state small">
          <div class="spinner-small"></div>
          <p>Loading transactions...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="transactionsError" class="error-state small">
          <p class="error-message">{{ transactionsError }}</p>
          <button @click="fetchTransactions(true)" class="btn-retry">Retry</button>
        </div>

        <!-- Transactions List -->
        <div v-else class="transactions-list">
          <div v-if="transactions.length === 0" class="no-data">
            No transactions found for this period
          </div>
          
          <div 
            v-for="transaction in transactions" 
            :key="transaction.id" 
            class="transaction-card"
            :class="transaction.type?.toLowerCase()"
          >
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
                  <span 
                    class="detail-value amount" 
                    :class="getAmountClass(transaction)"
                  >
                    {{ formatTransactionAmount(transaction) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Load More -->
          <div v-if="hasMoreTransactions" class="load-more">
            <button @click="loadMoreTransactions" class="btn-load-more" :disabled="transactionsLoading">
              {{ transactionsLoading ? 'Loading...' : 'Load More Transactions' }}
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
  setCache(cacheName, data, 5) // Expires in 5 minutes
}

// Initialize notification
const notification = useNotification()

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Cache keys for localStorage
const CALENDAR_CACHE_KEY = 'performance_calendar_cache'
const CALENDAR_TIMESTAMP_KEY = 'performance_calendar_timestamp'
const TRANSACTIONS_CACHE_KEY = 'performance_transactions_cache'
const TRANSACTIONS_TIMESTAMP_KEY = 'performance_transactions_timestamp'

// State
const selectedMonth = ref(new Date().getMonth() + 1) // 1-12
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

// Month options
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

// Years (last n years to next year)
const currentYear = new Date().getFullYear()
const years = computed(() => {
  const years = []
  for (let i = currentYear - 1; i <= currentYear + 5; i++) {
    years.push(i)
  }
  return years
})

// Weekdays
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ============== CACHE MANAGEMENT ==============
const saveCalendarToCache = (data) => {
  try {
    const cacheData = {
      data: data,
      month: selectedMonth.value,
      year: selectedYear.value
    }
    saveCacheData(CALENDAR_CACHE_KEY, JSON.stringify(cacheData), 10)
    saveCacheData(CALENDAR_TIMESTAMP_KEY, new Date().toISOString(), 10)
    // console.log('✅ Calendar data saved to cache')
  } catch (err) {
    console.error('Failed to save calendar to cache:', err)
  }
}

const loadCalendarFromCache = () => {
  try {
    const cached = getCache(CALENDAR_CACHE_KEY)
    // console.log("data " + cached)
    const timestamp = getCache(CALENDAR_TIMESTAMP_KEY)
    
    if (cached && timestamp) {
      const cacheData = JSON.parse(cached)
      
      // Check if cached data is for current month/year
      if (cacheData.month === selectedMonth.value && cacheData.year === selectedYear.value) {
        calendarData.value = cacheData.data
        // console.log('✅ Calendar loaded from cache')
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
    saveCacheData(cacheKey, JSON.stringify(cacheData) ,10)
    saveCacheData(TRANSACTIONS_TIMESTAMP_KEY, new Date().toISOString() ,10)
    // console.log('✅ Transactions saved to cache')
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
      
      // Check if filters match
      if (cacheData.filters.type === transactionFilter.type &&
          cacheData.filters.currency === transactionFilter.currency &&
          cacheData.filters.symbol === transactionFilter.symbol) {
        
        transactions.value = cacheData.data
        currentTransactionPage.value = cacheData.page
        hasMoreTransactions.value = cacheData.hasMore
        totalTransactionElements.value = cacheData.total
        
        // console.log('✅ Transactions loaded from cache')
        return true
      }
    }
  } catch (err) {
    console.error('Failed to load transactions from cache:', err)
  }
  return false
}

// ============== COMPUTED ==============
const startDayOffset = computed(() => {
  if (!calendarData.value) return 0
  const firstDay = new Date(calendarData.value.year, calendarData.value.month - 1, 1)
  return firstDay.getDay() // 0 = Sunday
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
  
  return {
    totalPnL,
    profitDays,
    lossDays,
    bestDay,
    worstDay
  }
})

// ============== STREAK CALCULATIONS (Fixed - ignores neutral days) ==============
const streakStats = computed(() => {
  if (!calendarData.value?.days) return null
  
  const days = calendarData.value.days
  // console.log('📊 Calculating streaks from days:', days.map(d => ({day: d.day, pnl: d.pnl})))
  
  // Sort days by day number to ensure we process in order
  const sortedDays = [...days].sort((a, b) => a.day - b.day)
  
  let currentWinStreak = 0
  let currentLossStreak = 0
  let longestWinStreak = 0
  let longestLossStreak = 0
  
  // For tracking streak dates
  let currentWinStart = null
  let currentWinEnd = null
  let currentLossStart = null
  let currentLossEnd = null
  let longestWinStart = null
  let longestWinEnd = null
  let longestLossStart = null
  let longestLossEnd = null
  
  // Track ongoing streaks (ignoring neutral days)
  let ongoingWinStreak = 0
  let ongoingLossStreak = 0
  let ongoingWinStart = null
  let ongoingLossStart = null
  
  // Track the last non-neutral result
  let lastNonNeutralResult = null // 'win' or 'loss'
  
  for (let i = 0; i < sortedDays.length; i++) {
    const day = sortedDays[i]
    
    if (day.pnl > 0) {
      // WIN DAY
      
      // If last non-neutral was also a win, continue the streak
      if (lastNonNeutralResult === 'win') {
        ongoingWinStreak++
        ongoingWinStart = ongoingWinStart // keep existing start
      } else {
        // New win streak starts
        ongoingWinStreak = 1
        ongoingWinStart = day.day
      }
      
      // Reset loss streak
      ongoingLossStreak = 0
      ongoingLossStart = null
      
      // Update last non-neutral
      lastNonNeutralResult = 'win'
      
      // Update current win streak (this is what's displayed)
      currentWinStreak = ongoingWinStreak
      currentWinEnd = day.day
      currentWinStart = ongoingWinStart
      
      // Current loss streak is reset
      currentLossStreak = 0
      currentLossStart = null
      currentLossEnd = null
      
      // Update longest win streak if needed
      if (ongoingWinStreak > longestWinStreak) {
        longestWinStreak = ongoingWinStreak
        longestWinStart = ongoingWinStart
        longestWinEnd = day.day
      }
      
    } else if (day.pnl < 0) {
      // LOSS DAY
      
      // If last non-neutral was also a loss, continue the streak
      if (lastNonNeutralResult === 'loss') {
        ongoingLossStreak++
        ongoingLossStart = ongoingLossStart // keep existing start
      } else {
        // New loss streak starts
        ongoingLossStreak = 1
        ongoingLossStart = day.day
      }
      
      // Reset win streak
      ongoingWinStreak = 0
      ongoingWinStart = null
      
      // Update last non-neutral
      lastNonNeutralResult = 'loss'
      
      // Update current loss streak (this is what's displayed)
      currentLossStreak = ongoingLossStreak
      currentLossEnd = day.day
      currentLossStart = ongoingLossStart
      
      // Current win streak is reset
      currentWinStreak = 0
      currentWinStart = null
      currentWinEnd = null
      
      // Update longest loss streak if needed
      if (ongoingLossStreak > longestLossStreak) {
        longestLossStreak = ongoingLossStreak
        longestLossStart = ongoingLossStart
        longestLossEnd = day.day
      }
      
    } else {
      // NEUTRAL DAY - do nothing, streaks continue as they were
      console.log(`Day ${day.day} is neutral, streaks continue: win=${ongoingWinStreak}, loss=${ongoingLossStreak}`)
    }
    
    console.log(`Day ${day.day}: pnl=${day.pnl}, currentWin=${currentWinStreak}, currentLoss=${currentLossStreak}`)
  }
  
  // console.log('📊 Streak Results:', {
  //   currentWinStreak,
  //   currentLossStreak,
  //   longestWinStreak,
  //   longestLossStreak,
  //   currentWinStart,
  //   currentWinEnd,
  //   currentLossStart,
  //   currentLossEnd
  // })
  
  return {
    currentWinStreak,
    currentLossStreak,
    longestWinStreak,
    longestLossStreak,
    currentWinStart,
    currentWinEnd,
    currentLossStart,
    currentLossEnd,
    longestWinStart,
    longestWinEnd,
    longestLossStart,
    longestLossEnd
  }
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return transactionFilter.type || transactionFilter.currency || transactionFilter.symbol
})

// ============== HELPER FUNCTIONS ==============
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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const formatSelectedDate = (day) => {
  if (!day || !calendarData.value) return ''
  const date = new Date(calendarData.value.year, calendarData.value.month - 1, day.day)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
  
  // Try different possible amount fields
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

// ============== FILTER CONTROLS ==============
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

// ============== API CALLS ==============
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

// Fetch monthly performance
const fetchMonthlyPerformance = async (forceRefresh = false) => {
  // Try to load from cache first (NO API CALL)
  if (!forceRefresh) {
    const loaded = loadCalendarFromCache()
    if (loaded) {
      // Still fetch transactions for the month
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        month: selectedMonth.value,
        year: selectedYear.value
      })
    })
    
    const data = await response.json()
    // console.log('📅 Calendar API response:', data)
    
    if (data.code === '200') {
      calendarData.value = data.data
      // console.log('📅 Calendar days:', data.data.days)
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

// Fetch transactions
const fetchTransactions = async (reset = true) => {
  // Try to load from cache first (NO API CALL)
  if (reset) {
    const loaded = loadTransactionsFromCache()
    if (loaded) {
      return
    }
  }
  
  if (reset) {
    currentTransactionPage.value = 0
    transactions.value = []
  }
  
  transactionsLoading.value = true
  transactionsError.value = null
  
  try {
    const token = getAuthToken()
    
    const payload = {
      size: transactionFilter.size || '10',
      page: currentTransactionPage.value.toString()
    }
    
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

// Watch for filter changes
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
</style>