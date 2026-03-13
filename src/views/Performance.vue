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
        <div class="stat-card">
          <span class="stat-label">Best Day</span>
          <span class="stat-value profit">{{ formatCurrency(monthlyStats.bestDay) }}</span>
        </div>
        <div class="stat-card">
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
      </div>

      <!-- Right Column - Transactions -->
      <div class="transactions-section">
        <div class="section-header">
          <h2>Transaction History</h2>
          <div class="transaction-filters">
            <select v-model="transactionFilter.type" @change="fetchTransactions" class="filter-select">
              <option value="">All</option>
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

            <input 
              v-model="transactionFilter.symbol" 
              @input="debouncedFetchTransactions"
              placeholder="Symbol..."
              class="filter-input"
            />
          </div>
        </div>

        <!-- Selected Day Info -->
        <div v-if="selectedDay" class="selected-day-info">
          <h3>{{ formatSelectedDate(selectedDay) }}</h3>
          <span class="day-total" :class="getPnLClass(selectedDay.pnl)">
            Total: {{ formatCurrency(selectedDay.pnl) }}
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
              <span class="transaction-type">{{ transaction.type }}</span>
              <span class="transaction-date">{{ formatTransactionDate(transaction.date) }}</span>
            </div>
            
            <div class="transaction-details">
              <div class="detail-item">
                <span class="detail-label">Symbol</span>
                <span class="detail-value">{{ transaction.symbol || '-' }}</span>
              </div>
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

          <!-- Load More -->
          <div v-if="hasMoreTransactions" class="load-more">
            <button @click="loadMoreTransactions" class="btn-load-more" :disabled="transactionsLoading">
              Load More
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
const API_BASE_URL = 'http://localhost:8080/kark-profit/transaction'

// State
const selectedMonth = ref(new Date().getMonth() + 1) // 1-12
const selectedYear = ref(new Date().getFullYear())
const selectedDay = ref(null)

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
  console.log(dateString)
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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

// Fetch transactions - FIXED DATE OFFSET ISSUE
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
    
    // FIX: Add date filter with correct day (no timezone offset)
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
.performance-page {
  padding: clamp(16px, 3vw, 24px);
  max-width: 1800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: var(--text-main);
  font-size: clamp(24px, 4vw, 32px);
}

.page-header .subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.dark .page-header .subtitle {
  color: #9ca3af;
}

.calendar-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .calendar-controls {
  background: #1f2937;
}

.date-selector {
  display: flex;
  gap: 12px;
}

.month-select,
.year-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: #1f2937;
  cursor: pointer;
}

.dark .month-select,
.dark .year-select {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.summary-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 100px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.stat-value.profit {
  color: #10b981;
}

.stat-value.loss {
  color: #ef4444;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr 350px;
  }
}

@media (max-width: 992px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
}

.calendar-section,
.transactions-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .calendar-section,
.dark .transactions-section {
  background: #1f2937;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.dark .section-header h2 {
  color: white;
}

.legend {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.legend-item {
  padding: 4px 8px;
  border-radius: 4px;
  background: #f3f4f6;
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

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.weekdays {
  display: contents;
}

.weekdays span {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.calendar-day:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.day-number {
  font-weight: 600;
  margin-bottom: 4px;
}

.day-pnl {
  font-size: 10px;
}

.transaction-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-select,
.filter-input {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  color: #1f2937;
}

.dark .filter-select,
.dark .filter-input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.filter-input {
  width: 100px;
}

.selected-day-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
}

.dark .selected-day-info {
  background: #374151;
}

.selected-day-info h3 {
  margin: 0;
  font-size: 14px;
  color: #1f2937;
}

.dark .selected-day-info h3 {
  color: white;
}

.day-total {
  font-size: 14px;
  font-weight: 600;
}

.transactions-list {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

.transaction-card {
  padding: 16px;
  margin-bottom: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.transaction-card:hover {
  transform: translateX(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  margin-bottom: 12px;
}

.transaction-type {
  font-weight: 600;
  font-size: 14px;
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
  font-size: 12px;
  color: #6b7280;
}

.dark .transaction-date {
  color: #9ca3af;
}

.transaction-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 2px;
}

.detail-value {
  font-size: 13px;
  font-weight: 500;
}

.detail-value.amount.profit {
  color: #10b981;
}

.detail-value.amount.loss {
  color: #ef4444;
}

.transaction-note {
  font-size: 12px;
  color: #6b7280;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.dark .transaction-note {
  border-top-color: #4b5563;
}

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
  font-size: 13px;
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

.dark .btn-load-more:hover {
  background: #4b5563;
}

/* Loading states */
.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.loading-state.small {
  padding: 20px;
}

.spinner-small {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error states */
.error-state {
  text-align: center;
  padding: 40px;
}

.error-state.small {
  padding: 20px;
}

.error-message {
  color: #ef4444;
  margin-bottom: 12px;
}

.btn-retry {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 12px;
}

.dark .btn-retry {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .calendar-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .summary-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .stat-card {
    align-items: flex-start;
  }
  
  .calendar-grid {
    gap: 4px;
  }
  
  .calendar-day {
    padding: 4px;
    font-size: 10px;
  }
  
  .day-pnl {
    font-size: 8px;
  }
  
  .transaction-details {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .transaction-filters {
    width: 100%;
  }
  
  .filter-input {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .date-selector {
    width: 100%;
  }
  
  .month-select,
  .year-select {
    flex: 1;
  }
  
  .summary-stats {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .stat-card {
    min-width: calc(50% - 6px);
  }
  
  .calendar-day {
    font-size: 9px;
  }
  
  .day-number {
    margin-bottom: 2px;
  }
  
  .day-pnl {
    font-size: 7px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .legend {
    width: 100%;
    justify-content: space-between;
  }
  
  .selected-day-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* Touch improvements */
@media (hover: none) and (pointer: coarse) {
  .calendar-day {
    min-height: 50px;
  }
  
  .btn-load-more,
  .btn-retry {
    padding: 12px 20px;
  }
  
  .filter-select,
  .filter-input {
    font-size: 16px;
  }
}
</style>