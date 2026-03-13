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
            {{ formatCurrency(monthlyStats.totalPnL) }}
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
        <div class="stat-card desktop-only">
          <span class="stat-label">Best Day</span>
          <span class="stat-value profit">{{ formatCurrency(monthlyStats.bestDay) }}</span>
        </div>
        <div class="stat-card desktop-only">
          <span class="stat-label">Worst Day</span>
          <span class="stat-value loss">{{ formatCurrency(monthlyStats.worstDay) }}</span>
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
            <span class="day-pnl">{{ formatPnL(day.pnl) }}</span>
          </div>
        </div>

        <!-- Mobile summary stats (visible only on mobile) -->
        <div class="mobile-summary-stats mobile-only" v-if="monthlyStats">
          <div class="mobile-stats-grid">
            <div class="mobile-stat-item">
              <span class="mobile-stat-label">Best Day</span>
              <span class="mobile-stat-value profit">{{ formatCurrency(monthlyStats.bestDay) }}</span>
            </div>
            <div class="mobile-stat-item">
              <span class="mobile-stat-label">Worst Day</span>
              <span class="mobile-stat-value loss">{{ formatCurrency(monthlyStats.worstDay) }}</span>
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
            Filters
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
        <div v-if="transactionsLoading" class="loading-state small">
          <div class="spinner-small"></div>
          <p>Loading transactions...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="transactionsError" class="error-state small">
          <p class="error-message">{{ transactionsError }}</p>
          <button @click="fetchTransactions" class="btn-retry">Retry</button>
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
                  <span class="detail-label">Lot Size</span>
                  <span class="detail-value">{{ transaction.lot_size || '-' }}</span>
                </div>
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

// Initialize notification
const notification = useNotification()

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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

// Years (last 5 years to next year)
const currentYear = new Date().getFullYear()
const years = computed(() => {
  const years = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i)
  }
  return years
})

// Weekdays
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Calendar helpers
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

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return transactionFilter.type || transactionFilter.currency || transactionFilter.symbol
})

// Helper functions
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatPnL = (value) => {
  if (value === 0) return '-'
  if (value > 0) return `+${value.toFixed(2)}`
  return value.toFixed(2)
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
    return formatCurrency(amount)
  }
  
  return `${formatCurrency(amount)} ${transaction.currency || 'USD'}`
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
  fetchTransactions()
  // Close mobile filters if open
  showFilters.value = false
}

// Filter controls
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

// Get auth token
const getAuthToken = () => {
  const authToken = localStorage.getItem('authToken')
  if (!authToken) {
    notification.error('No authentication token found')
    throw new Error('No authentication token found')
  }
  return authToken
}

// Debounce function for search
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Fetch monthly performance
const fetchMonthlyPerformance = async () => {
  calendarLoading.value = true
  calendarError.value = null
  
  try {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/monthly/performance`, {
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
    
    if (data.code === '200') {
      calendarData.value = data.data
      // Reset selected day when month changes
      selectedDay.value = null
      // Fetch transactions for new month
      fetchTransactions()
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
    
    // Add optional filters
    if (transactionFilter.type) payload.type = transactionFilter.type
    if (transactionFilter.currency) payload.currency = transactionFilter.currency
    if (transactionFilter.symbol) payload.symbol = transactionFilter.symbol
    
    // Add date filter with correct day (no timezone offset)
    if (selectedDay.value && calendarData.value) {
      // Format date as YYYY-MM-DD without timezone issues
      const year = calendarData.value.year
      const month = String(calendarData.value.month).padStart(2, '0')
      const day = String(selectedDay.value.day).padStart(2, '0')
      payload.date = `${year}-${month}-${day}`
    }
    
    const response = await fetch(`${API_BASE_URL}/fetch`, {
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

// Load more transactions
const loadMoreTransactions = () => {
  if (hasMoreTransactions.value && !transactionsLoading.value) {
    currentTransactionPage.value++
    fetchTransactions(false)
  }
}

// Debounced search
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
/* Global reset for scoped component */
.performance-page {
  --max-width: 1800px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  width: 100%;
  max-width: 100%;
  min-height: 100%;
  padding: clamp(12px, 2vw, 24px);
  margin: 0 auto;
  box-sizing: border-box;
  overflow-x: hidden;
  position: relative;
}

/* Ensure all elements use border-box */
.performance-page *,
.performance-page *::before,
.performance-page *::after {
  box-sizing: border-box;
}

/* Remove default button styles and prevent scaling */
button {
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  transform: scale(1);
  transition: transform 0.1s, background-color 0.2s, border-color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

button:active {
  transform: scale(0.98); /* Consistent press effect */
}

/* Remove browser default styles that might cause scaling */
input, select, button {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: 8px;
}

/* Prevent zoom on input focus for iOS */
@media screen and (-webkit-min-device-pixel-ratio: 0) { 
  select,
  textarea,
  input {
    font-size: 16px !important;
  }
}

/* Page header */
.page-header {
  margin-bottom: clamp(16px, 3vw, 24px);
  width: 100%;
  max-width: 100%;
}

.page-header h1 {
  margin: 0 0 4px 0;
  color: var(--text-main);
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  line-height: 1.2;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.page-header .subtitle {
  margin: 0;
  color: #6b7280;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.dark .page-header .subtitle {
  color: #9ca3af;
}

/* Calendar controls */
.calendar-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
  background: var(--bg-panel);
  padding: clamp(12px, 2vw, 16px) clamp(16px, 3vw, 20px);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* Add some spacing between the two selects */
.date-selector {
  display: flex;
  gap: 12px; /* Increased gap */
  flex-wrap: wrap;
  max-width: 100%;
}

/* Month/Year selects */
.month-select,
.year-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  background: var(--bg-panel);
  color: var(--text-main);
  cursor: pointer;
  min-width: 100px;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  transition: all 0.2s;
  transform: scale(1);
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;
}

/* Hover effect for better interaction */
.month-select:hover,
.year-select:hover {
  border-color: #9ca3af;
  background-color: var(--bg-panel);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.month-select:active,
.year-select:active {
  transform: scale(1);
}

/* Focus state */
.month-select:focus,
.year-select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}


.dark .month-select,
.dark .year-select {
  background-color: #374151;
  border-color: #4b5563;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.dark .month-select:hover,
.dark .year-select:hover {
  border-color: #6b7280;
  background-color: #3f4a5c;
}

/* Summary stats */
.summary-stats {
  display: flex;
  gap: clamp(12px, 3vw, 24px);
  flex-wrap: wrap;
  max-width: 100%;
}

.stat-card {
  display: flex;
  flex-direction: column;
  min-width: 80px;
  max-width: 150px;
}

.stat-label {
  font-size: clamp(0.625rem, 1.5vw, 0.75rem);
  color: #6b7280;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.stat-value {
  font-size: clamp(0.875rem, 2vw, 1rem);
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.stat-value.profit {
  color: #10b981;
}

.stat-value.loss {
  color: #ef4444;
}

/* Content wrapper */
.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr 350px;
    gap: 20px;
  }
}

@media (max-width: 992px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

/* Calendar section */
.calendar-section,
.transactions-section {
  background: var(--bg-panel);
  border-radius: 12px;
  padding: clamp(16px, 3vw, 24px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  min-width: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  max-width: 100%;
}

.section-header h2 {
  margin: 0;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: var(--text-main);
  font-weight: 600;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

/* Legend */
.legend {
  display: flex;
  gap: 8px;
  font-size: clamp(0.625rem, 1.5vw, 0.75rem);
  flex-wrap: wrap;
  max-width: 100%;
}

.legend-item {
  padding: 4px 8px;
  border-radius: 6px;
  background: #f3f4f6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.legend-item.profit {
  background: #d1fae5;
  color: #065f46;
}

.legend-item.loss {
  background: #fee2e2;
  color: #991b1b;
}

.legend-item.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

.dark .legend-item.profit {
  background: #064e3b;
  color: #a7f3d0;
}

.dark .legend-item.loss {
  background: #7f1d1d;
  color: #fecaca;
}

.dark .legend-item.neutral {
  background: #374151;
  color: #9ca3af;
}

/* Calendar grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: clamp(4px, 1vw, 8px);
  margin-bottom: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.weekdays {
  display: contents;
}

.weekdays span {
  text-align: center;
  font-size: clamp(0.625rem, 1.5vw, 0.75rem);
  font-weight: 600;
  color: #6b7280;
  padding: 8px 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(4px, 1vw, 8px);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: clamp(0.625rem, 1.5vw, 0.75rem);
  min-height: 40px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  transform: scale(1);
  -webkit-tap-highlight-color: transparent;
}

.calendar-day:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.calendar-day:active {
  transform: scale(0.98);
}

.calendar-day.profit-day {
  background: #d1fae5;
  color: #065f46;
}

.calendar-day.loss-day {
  background: #fee2e2;
  color: #991b1b;
}

.calendar-day.neutral-day {
  background: #f3f4f6;
  color: #6b7280;
}

.dark .calendar-day.profit-day {
  background: #064e3b;
  color: #a7f3d0;
}

.dark .calendar-day.loss-day {
  background: #7f1d1d;
  color: #fecaca;
}

.dark .calendar-day.neutral-day {
  background: #374151;
  color: #9ca3af;
}

.calendar-day.empty {
  background: none;
  cursor: default;
}

.calendar-day.empty:hover {
  transform: none;
  box-shadow: none;
}

.calendar-day.empty:active {
  transform: none;
}

.day-number {
  font-weight: 600;
  margin-bottom: 2px;
  font-size: clamp(0.625rem, 1.5vw, 0.75rem);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-pnl {
  font-size: clamp(0.5rem, 1.2vw, 0.625rem);
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Mobile summary stats */
.mobile-summary-stats {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  width: 100%;
  max-width: 100%;
}

.dark .mobile-summary-stats {
  border-top-color: #4b5563;
}

.mobile-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.mobile-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px;
  background: #f3f4f6;
  border-radius: 8px;
  width: 100%;
  min-width: 0;
}

.dark .mobile-stat-item {
  background: #374151;
}

.mobile-stat-label {
  font-size: 0.7rem;
  color: #6b7280;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.mobile-stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.mobile-stat-value.profit {
  color: #10b981;
}

.mobile-stat-value.loss {
  color: #ef4444;
}

/* Filter toggle button */
.filter-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: var(--text-main);
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  line-height: 1;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  width: auto;
  min-width: 80px;
  max-width: 120px;
  box-sizing: border-box;
  transform: scale(1);
  -webkit-tap-highlight-color: transparent;
}

.filter-toggle:hover {
  background: #e5e7eb;
}

.filter-toggle:active {
  transform: scale(0.98);
  background: #d1d5db;
}

.filter-toggle:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.filter-toggle:focus:not(:focus-visible) {
  outline: none;
}

/* Transaction filters */
.transaction-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  width: 100%;
}

.filters-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
}

.close-filters {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transform: scale(1);
}

.close-filters:active {
  transform: scale(0.98);
  background: #f3f4f6;
}

/* Filter selects and inputs */
.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  background: var(--bg-panel);
  color: var(--text-main);
  flex: 1 1 auto;
  min-width: 120px;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  transition: all 0.2s;
  transform: scale(1);
  -webkit-appearance: none;
  appearance: none;
}

.filter-select {
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;
}

.filter-select:active,
.filter-input:active {
  transform: scale(1);
}

.filter-select:focus,
.filter-input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-color: transparent;
}

.dark .filter-select,
.dark .filter-input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

/* Search wrapper */
.search-wrapper {
  position: relative;
  flex: 1 1 auto;
  min-width: 140px;
  max-width: 200px;
  height: 40px;
}

.search-wrapper .filter-input {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  min-height: 40px;
  max-height: 40px;
  padding-right: 32px;
  background-image: none;
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 0.875rem;
  pointer-events: none;
  z-index: 1;
}

/* Clear filters button */
.clear-filters {
  width: 100%;
  padding: 10px;
  margin-top: 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  transition: all 0.2s;
  transform: scale(1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-filters:active {
  transform: scale(0.98);
  background: #e5e7eb;
}

/* Selected day info */
.selected-day-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f3f4f6;
  border-radius: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  gap: 12px;
}

.dark .selected-day-info {
  background: #374151;
}

.selected-day-info h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-main);
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.day-total {
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Transactions list */
.transactions-list {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  width: 100%;
  box-sizing: border-box;
}

/* Custom scrollbar */
.transactions-list::-webkit-scrollbar {
  width: 6px;
}

.transactions-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.transactions-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.transactions-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.dark .transactions-list::-webkit-scrollbar-track {
  background: #374151;
}

.dark .transactions-list::-webkit-scrollbar-thumb {
  background: #6b7280;
}

/* Transaction cards */
.transaction-card {
  padding: 16px;
  margin-bottom: 12px;
  background: #f9fafb;
  border-radius: 10px;
  border-left: 4px solid transparent;
  transition: all 0.2s;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  transform: scale(1);
}

.transaction-card:hover {
  transform: translateX(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.transaction-card:active {
  transform: translateX(-2px) scale(0.99);
}

.transaction-card.profit {
  border-left-color: #10b981;
}

.transaction-card.loss {
  border-left-color: #ef4444;
}

.transaction-card.deposit {
  border-left-color: #3b82f6;
}

.transaction-card.withdrawal {
  border-left-color: #f59e0b;
}

.dark .transaction-card {
  background: #374151;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.transaction-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 100%;
}

.transaction-type {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.transaction-symbol {
  font-size: 0.75rem;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .transaction-symbol {
  background: #4b5563;
  color: #9ca3af;
}

.transaction-card.profit .transaction-type {
  color: #10b981;
}

.transaction-card.loss .transaction-type {
  color: #ef4444;
}

.transaction-card.deposit .transaction-type {
  color: #3b82f6;
}

.transaction-card.withdrawal .transaction-type {
  color: #f59e0b;
}

.transaction-date {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.dark .transaction-date {
  color: #9ca3af;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

.detail-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100%;
}

.detail-label {
  font-size: 0.625rem;
  color: #6b7280;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.detail-value.amount.profit {
  color: #10b981;
}

.detail-value.amount.loss {
  color: #ef4444;
}

/* Load more button */
.load-more {
  text-align: center;
  margin-top: 20px;
  width: 100%;
}

.btn-load-more {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: var(--bg-panel);
  color: var(--text-main);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  box-sizing: border-box;
  transform: scale(1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-load-more:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-load-more:active:not(:disabled) {
  transform: scale(0.98);
  background: #f3f4f6;
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: scale(1);
}

.dark .btn-load-more {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.dark .btn-load-more:hover:not(:disabled) {
  background: #4b5563;
}

/* Loading states */
.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  width: 100%;
}

.loading-state.small {
  padding: 30px;
}

.spinner-small {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error states */
.error-state {
  text-align: center;
  padding: 40px;
  width: 100%;
}

.error-state.small {
  padding: 30px;
}

.error-message {
  color: #ef4444;
  margin-bottom: 16px;
  font-size: 0.875rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

/* Retry button */
.btn-retry {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: var(--bg-panel);
  color: var(--text-main);
  cursor: pointer;
  font-size: 0.875rem;
  white-space: nowrap;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  transition: all 0.2s;
  transform: scale(1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-retry:active {
  transform: scale(0.98);
  background: #f3f4f6;
}

.dark .btn-retry {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.dark .btn-retry:active {
  background: #4b5563;
}

/* No data */
.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-size: 0.875rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  width: 100%;
}

/* Responsive utilities */
.mobile-only {
  display: none !important;
}

.desktop-only {
  display: block !important;
}

/* Fix for select arrows in Firefox */
@-moz-document url-prefix() {
  select {
    text-indent: 0.01px;
    text-overflow: '';
    padding-right: 32px;
  }
}

/* Fix for IE */
select::-ms-expand {
  display: none;
}

/* Tablet styles */
@media (max-width: 992px) and (min-width: 769px) {
  .stat-card {
    min-width: 70px;
  }
  
  .filter-select,
  .filter-input,
  .search-wrapper {
    max-width: 160px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .mobile-only {
    display: flex !important;
  }
  
  .desktop-only {
    display: none !important;
  }

  .calendar-controls {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }

  .date-selector {
    width: 100%;
    gap: 8px;
  }

  /* Month/Year selects - with improved spacing */
month-select,
  .year-select {
    min-width: 0;
    flex: 1;
    height: 48px; /* Taller on mobile for better touch */
    min-height: 48px;
    max-height: 48px;
    font-size: 16px;
    padding: 8px 16px;
    padding-right: 40px;
    background-position: right 12px center;
  }

  .summary-stats {
    width: 100%;
    justify-content: space-between;
    gap: 8px;
  }

  .stat-card {
    min-width: calc(33.33% - 6px);
    max-width: calc(33.33% - 6px);
  }

  .stat-card:nth-child(4),
  .stat-card:nth-child(5) {
    display: none;
  }

  .filter-toggle {
    height: 44px;
    min-height: 44px;
    max-height: 44px;
    font-size: 16px;
    padding: 0 16px;
    width: 100%;
    max-width: none;
    justify-content: center;
  }

  /* Mobile filters overlay */
  .transaction-filters {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-panel);
    z-index: 1000;
    padding: 20px;
    margin: 0;
    flex-direction: column;
    align-items: stretch;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .transaction-filters.show {
    transform: translateX(0);
  }

  .filter-select,
  .filter-input,
  .search-wrapper {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    height: 44px;
    min-height: 44px;
    max-height: 44px;
    font-size: 16px;
  }

  .filter-select,
  .filter-input {
    padding: 12px;
    padding-right: 32px;
  }

  .search-wrapper {
    height: 44px;
  }

  .search-wrapper .filter-input {
    height: 44px;
    min-height: 44px;
    max-height: 44px;
    padding: 12px 32px 12px 12px;
  }

  .clear-filters {
    height: 44px;
    min-height: 44px;
    max-height: 44px;
    font-size: 16px;
    margin-top: 16px;
  }

  .filters-header {
    margin-bottom: 20px;
  }

  .filters-header h3 {
    font-size: 1.2rem;
  }

  .close-filters {
    height: 44px;
    width: 44px;
    font-size: 1.5rem;
  }

  .calendar-grid {
    gap: 12px;
  }

  .calendar-day {
    min-height: 44px;
    padding: 4px 2px;
  }

  .transactions-list {
    max-height: 500px;
  }

  .transaction-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .transaction-left {
    width: 100%;
    gap: 4px;
  }

  .transaction-type,
  .transaction-symbol {
    font-size: 16px;
  }

  .transaction-date {
    font-size: 14px;
  }

  .detail-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .detail-label {
    font-size: 12px;
  }

  .detail-value {
    font-size: 16px;
  }

  .mobile-stat-item {
    padding: 12px 8px;
  }

  .btn-load-more {
    height: 48px;
    min-height: 48px;
    max-height: 48px;
    font-size: 16px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .month-select,
  .year-select {
    padding: 8px 12px;
    padding-right: 36px;
    background-position: right 8px center;
  }
  .performance-page {
    padding: 8px;
  }

  .calendar-controls {
    padding: 12px;
  }

  .summary-stats {
    gap: 4px;
  }

  .stat-card {
    min-width: calc(33.33% - 3px);
    max-width: calc(33.33% - 3px);
  }

  .stat-label {
    font-size: 0.6rem;
  }

  .stat-value {
    font-size: 0.8rem;
  }

  .calendar-day {
    min-height: 40px;
    padding: 2px;
  }

  .day-number {
    font-size: 0.6rem;
  }

  .day-pnl {
    font-size: 0.45rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .legend {
    width: 100%;
    justify-content: space-between;
    gap: 4px;
  }

  .legend-item {
    flex: 1;
    text-align: center;
    padding: 6px 4px;
    font-size: 0.7rem;
  }

  .selected-day-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
  }

  .selected-day-info h3 {
    font-size: 0.9rem;
    word-break: break-word;
  }

  .day-total {
    align-self: flex-end;
    font-size: 1.1rem;
  }

  .transaction-card {
    padding: 12px;
  }

  .transaction-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .transaction-type {
    font-size: 1rem;
  }

  .transaction-symbol {
    font-size: 0.85rem;
  }

  .mobile-stat-label {
    font-size: 0.8rem;
  }

  .mobile-stat-value {
    font-size: 1rem;
  }
}

/* Extra small mobile styles */
@media (max-width: 360px) {
  .stat-card {
    min-width: 100%;
    max-width: 100%;
  }

  .stat-card:nth-child(1),
  .stat-card:nth-child(2),
  .stat-card:nth-child(3) {
    min-width: 100%;
  }

  .legend {
    flex-direction: column;
    gap: 6px;
  }

  .legend-item {
    width: 100%;
  }

  .calendar-day {
    min-height: 35px;
  }

  .day-number {
    font-size: 0.55rem;
  }

  .day-pnl {
    font-size: 0.4rem;
  }
}

/* Landscape mode */
@media (max-width: 768px) and (orientation: landscape) {
  .calendar-controls {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .summary-stats {
    width: auto;
  }

  .transaction-filters {
    padding: 12px;
  }

  .filter-select,
  .filter-input {
    padding: 8px;
  }

  .transactions-list {
    max-height: 300px;
  }

  .transaction-card {
    padding: 12px;
  }

  .mobile-stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .calendar-day {
    min-height: 44px;
    min-width: 44px;
  }

  .btn-load-more,
  .btn-retry,
  .filter-toggle,
  .clear-filters,
  .filter-select,
  .filter-input,
  .month-select,
  .year-select,
  .close-filters {
    min-height: 44px;
  }

  .filter-select,
  .filter-input,
  .month-select,
  .year-select {
    font-size: 16px;
  }

  .transaction-card {
    cursor: pointer;
  }

  .calendar-day {
    cursor: pointer;
  }
}

/* Focus styles for accessibility */
.calendar-day:focus-visible,
.filter-select:focus-visible,
.filter-input:focus-visible,
.btn-load-more:focus-visible,
.btn-retry:focus-visible,
.filter-toggle:focus-visible,
.month-select:focus-visible,
.year-select:focus-visible,
.close-filters:focus-visible,
.clear-filters:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Remove focus outline for mouse users */
.calendar-day:focus:not(:focus-visible),
.filter-select:focus:not(:focus-visible),
.filter-input:focus:not(:focus-visible),
.btn-load-more:focus:not(:focus-visible),
.btn-retry:focus:not(:focus-visible),
.filter-toggle:focus:not(:focus-visible),
.month-select:focus:not(:focus-visible),
.year-select:focus:not(:focus-visible),
.close-filters:focus:not(:focus-visible),
.clear-filters:focus:not(:focus-visible) {
  outline: none;
}

/* High refresh rate displays */
@media (min-width: 1920px) {
  .performance-page {
    padding: 32px;
    max-width: 2000px;
  }

  .calendar-grid {
    gap: 18px;
  }

  .calendar-day {
    padding: 12px;
  }

  .day-number {
    font-size: 1rem;
  }

  .day-pnl {
    font-size: 0.75rem;
  }

  .transaction-card {
    padding: 20px;
  }

  .transaction-type {
    font-size: 1rem;
  }

  .transaction-symbol {
    font-size: 0.875rem;
  }

  .transaction-date {
    font-size: 0.875rem;
  }

  .detail-label {
    font-size: 0.75rem;
  }

  .detail-value {
    font-size: 1rem;
  }

  .filter-toggle,
  .filter-select,
  .filter-input,
  .month-select,
  .year-select,
  .btn-retry,
  .clear-filters {
    height: 44px;
    min-height: 44px;
    max-height: 44px;
    font-size: 1rem;
  }
}

/* Print styles */
@media print {
  .performance-page {
    padding: 0;
    max-width: 100%;
  }

  .calendar-controls,
  .transaction-filters,
  .filter-toggle,
  .btn-load-more,
  .btn-retry,
  .clear-filters,
  .close-filters {
    display: none;
  }

  .calendar-day {
    break-inside: avoid;
  }

  .transaction-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

/* Dark mode adjustments */
.dark .calendar-day:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dark .transaction-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dark .filter-toggle:hover,
.dark .clear-filters:hover,
.dark .close-filters:hover {
  background: #4b5563;
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .calendar-day,
  .transaction-card,
  .transaction-filters,
  .spinner-small,
  button,
  .filter-toggle,
  .filter-select,
  .filter-input,
  .month-select,
  .year-select,
  .btn-load-more,
  .btn-retry,
  .clear-filters,
  .close-filters {
    transition: none;
    animation: none;
  }
  
  .calendar-day:hover,
  .calendar-day:active,
  button:active,
  .filter-toggle:active,
  .btn-load-more:active,
  .btn-retry:active,
  .clear-filters:active,
  .close-filters:active {
    transform: none;
  }
}
</style>