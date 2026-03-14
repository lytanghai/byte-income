<template>
  <div class="transaction-page">
    <!-- Header -->
    <div class="page-header">
      <h1>Transaction Management</h1>
      <p class="subtitle">Create, view, update and delete trading transactions</p>
    </div>

    <!-- Action Bar with Create and Refresh Buttons -->
    <div class="action-bar">
      <button class="btn btn-primary" @click="openCreateModal">
        <span class="btn-icon">+</span> Add New Transaction
      </button>
      
      <div class="action-group">
        <!-- Cache Status -->
        <span v-if="cacheStatus" class="cache-status" :class="cacheStatus.type">
          <span class="status-dot"></span>
          {{ cacheStatus.text }}
          <span v-if="cacheStatus.type === 'cached'" class="cache-time">
            ({{ formatTimeAgo(lastUpdated) }})
          </span>
        </span>
        
        <!-- Last Updated Info -->
        <span v-if="lastUpdated" class="last-updated">
          Last updated: {{ formatTimeAgo(lastUpdated) }}
        </span>
        
        <!-- Refresh Button -->
        <button 
          class="btn btn-refresh" 
          @click="handleRefresh" 
          :disabled="refreshing"
          :class="{ 'refreshing': refreshing }"
          title="Refresh data"
        >
          <span class="refresh-icon" :class="{ 'spin': refreshing }">↻</span>
          {{ refreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Search and Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <input 
          type="text" 
          v-model="filters.symbol" 
          placeholder="Symbol (XAU, XAG...)"
          class="filter-input"
          @input="debouncedApplyFilters"
        />
      </div>
      
      <div class="filter-group">
        <select v-model="filters.type" @change="applyFilters" class="filter-select">
          <option value="">All Types</option>
          <option value="PROFIT">Profit</option>
          <option value="LOSS">Loss</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
        </select>
      </div>
      
      <div class="filter-group">
        <select v-model="filters.currency" @change="applyFilters" class="filter-select">
          <option value="">All Currencies</option>
          <option value="USD">USD</option>
          <option value="USDC">USDC</option>
        </select>
      </div>
      
      <div class="filter-group">
        <input 
          type="date" 
          v-model="filters.date" 
          class="filter-input"
          @change="applyFilters"
        />
      </div>
      
      <button @click="resetFilters" class="btn btn-secondary" :disabled="!hasActiveFilters">
        Clear Filters
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards" v-if="transactions.length > 0">
      <div class="summary-card">
        <div class="card-icon profit">📊</div>
        <div class="card-content">
          <span class="card-label">Total Profit</span>
          <span class="card-value profit">{{ formatCurrency(summary.totalProfit) }}</span>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon loss">📉</div>
        <div class="card-content">
          <span class="card-label">Total Loss</span>
          <span class="card-value loss">{{ formatCurrency(summary.totalLoss) }}</span>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <span class="card-label">Net P&L</span>
          <span class="card-value" :class="getProfitClass(summary.netPnL)">
            {{ formatCurrency(summary.netPnL) }}
          </span>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon">📋</div>
        <div class="card-content">
          <span class="card-label">Total Transactions</span>
          <span class="card-value">{{ summary.totalCount }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State (only shows on initial load if no cache) -->
    <div v-if="loading && transactions.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Loading transactions...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchFromAPI(true)" class="btn-retry">Retry</button>
    </div>

    <!-- Transactions Table -->
    <div v-else-if="transactions.length > 0" class="table-container">
      <div class="table-responsive">
        <table class="transactions-table">
          <thead>
            <tr>
              <th>SN</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Lot Size</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in paginatedTransactions" :key="transaction.sn">
              <td class="sn-cell">#{{ transaction.sn }}</td>
              <td>
                <span class="symbol-badge">{{ transaction.symbol || '-' }}</span>
              </td>
              <td>
                <span class="type-badge" :class="transaction.type.toLowerCase()">
                  {{ transaction.type }}
                </span>
              </td>
              <td>{{ transaction.lot_size ? transaction.lot_size.toFixed(2) : '-' }}</td>
              <td :class="getAmountClass(transaction)">
                {{ formatTransactionAmount(transaction) }}
              </td>
              <td>{{ transaction.currency }}</td>
              <td class="date-cell">{{ formatDate(transaction.date) }}</td>
              <td class="actions-cell">
                <button class="action-btn edit" @click="openEditModal(transaction)" title="Edit">
                  ✏️
                </button>
                <button class="action-btn delete" @click="confirmDelete(transaction)" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ← Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="no-data">
      <div class="no-data-icon">📭</div>
      <h3>No Transactions Found</h3>
      <p>Create your first transaction to get started</p>
      <button @click="openCreateModal" class="btn btn-primary">Add Transaction</button>
      <button @click="fetchFromAPI(true)" class="btn btn-secondary">Refresh Data</button>
    </div>

    <!-- Create/Edit Transaction Modal -->
    <div v-if="showTransactionModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ modalMode === 'create' ? 'Create Transaction' : 'Edit Transaction' }}</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modal-form">
          <div v-if="modalMode === 'edit'" class="form-group">
            <label>Transaction SN</label>
            <input type="text" :value="form.sn" class="form-input" disabled />
          </div>

          <!-- Symbol Field (optional for DEPOSIT/WITHDRAWAL) -->
          <div class="form-group">
            <label for="symbol">Symbol {{ isTradingType ? '*' : '(Optional)' }}</label>
            <select 
              id="symbol"
              v-model="form.symbol" 
              :required="isTradingType"
              class="form-select"
            >
              <option value="">-- Select Symbol --</option>
              <option value="XAU">XAU (Gold)</option>
              <option value="XAG">XAG (Silver)</option>
              <option value="AUD">AUD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <small v-if="!isTradingType" class="hint">Optional for deposits/withdrawals</small>
          </div>

          <!-- Transaction Type -->
          <div class="form-group">
            <label>Transaction Type *</label>
            <div class="radio-group">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="form.type" 
                  value="PROFIT"
                  required
                  @change="handleTypeChange"
                />
                <span class="radio-label profit">Profit</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="form.type" 
                  value="LOSS"
                  required
                  @change="handleTypeChange"
                />
                <span class="radio-label loss">Loss</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="form.type" 
                  value="DEPOSIT"
                  required
                  @change="handleTypeChange"
                />
                <span class="radio-label deposit">Deposit</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="form.type" 
                  value="WITHDRAWAL"
                  required
                  @change="handleTypeChange"
                />
                <span class="radio-label withdrawal">Withdrawal</span>
              </label>
            </div>
          </div>

          <!-- Lot Size Field (only for PROFIT/LOSS) -->
          <div v-if="isTradingType" class="form-group">
            <label for="lot_size">Lot Size *</label>
            <input 
              type="number" 
              id="lot_size"
              v-model="form.lot_size" 
              step="0.01"
              min="0"
              required
              class="form-input"
              placeholder="0.01"
            />
          </div>

          <!-- Amount Field -->
          <div class="form-group">
            <label for="pnl">{{ amountLabel }} *</label>
            <input 
              type="number" 
              id="pnl"
              v-model="form.pnl" 
              step="0.01"
              required
              class="form-input"
              :placeholder="amountPlaceholder"
            />
          </div>

          <!-- Currency Field -->
          <div class="form-group">
            <label for="currency">Currency *</label>
            <select 
              id="currency"
              v-model="form.currency" 
              required
              class="form-select"
            >
              <option value="">Select Currency</option>
              <option value="USD">USD</option>
              <option value="USDC">USDC</option>
            </select>
          </div>

          <!-- Date Field (Optional) -->
          <div class="form-group">
            <label for="date">Transaction Date (Optional)</label>
            <input 
              type="date" 
              id="date"
              v-model="form.date" 
              class="form-input"
            />
            <small class="hint">Leave empty to use current date</small>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-small"></span>
              {{ submitting ? 'Saving...' : (modalMode === 'create' ? 'Create Transaction' : 'Update Transaction') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content confirm-delete" @click.stop>
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="close-btn" @click="closeDeleteModal">✕</button>
        </div>
        
        <div class="delete-content">
          <div class="delete-icon">⚠️</div>
          <p class="delete-message">
            Are you sure you want to delete transaction 
            <strong>#{{ selectedTransaction?.sn }} - {{ selectedTransaction?.symbol || 'N/A' }}</strong>?
          </p>
          <p class="warning">This action cannot be undone.</p>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
            Cancel
          </button>
          <button type="button" class="btn btn-danger" @click="handleDelete" :disabled="submitting">
            <span v-if="submitting" class="spinner-small"></span>
            {{ submitting ? 'Deleting...' : 'Delete Transaction' }}
          </button>
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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/transaction'

// Cache keys for localStorage
const CACHE_KEY = 'transaction_cache'
const CACHE_TIMESTAMP_KEY = 'transaction_cache_timestamp'

// State
const transactions = ref([])
const loading = ref(false)
const refreshing = ref(false)
const error = ref(null)
const submitting = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalPages = ref(1)
const lastUpdated = ref(null)
const cacheStatus = ref({ type: 'fresh', text: 'Loading...' })

// Modal states
const showTransactionModal = ref(false)
const showDeleteModal = ref(false)
const modalMode = ref('create')
const selectedTransaction = ref(null)

// Form state
const form = reactive({
  sn: null,
  symbol: '',
  type: '',
  lot_size: '',
  pnl: '',
  currency: '',
  date: ''
})

// Filters
const filters = reactive({
  symbol: '',
  type: '',
  currency: '',
  date: ''
})

// Check if selected type is trading (PROFIT/LOSS)
const isTradingType = computed(() => {
  return form.type === 'PROFIT' || form.type === 'LOSS' || form.type === 'DEPOSIT' || form.type === 'WITHDRAWAL'
})

// Dynamic amount label based on type
const amountLabel = computed(() => {
  switch(form.type) {
    case 'PROFIT':
      return 'Profit Amount'
    case 'LOSS':
      return 'Loss Amount'
    case 'DEPOSIT':
      return 'Deposit Amount'
    case 'WITHDRAWAL':
      return 'Withdrawal Amount'
    default:
      return 'Amount'
  }
})

const amountPlaceholder = computed(() => {
  switch(form.type) {
    case 'PROFIT':
      return '100.60'
    case 'LOSS':
      return '50.25'
    case 'DEPOSIT':
      return '1000.00'
    case 'WITHDRAWAL':
      return '500.00'
    default:
      return '0.00'
  }
})

// Handle type change
const handleTypeChange = () => {
  if (!isTradingType.value) {
    form.lot_size = ''
    form.symbol = ''
  }
}

// Get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    notification.error('Please login first')
    throw new Error('No authentication token')
  }
  return token
}

// ============== CACHE MANAGEMENT ==============
const saveToCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    const timestamp = new Date().toISOString()
    localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp)
    lastUpdated.value = timestamp
    cacheStatus.value = { type: 'cached', text: 'Cached data' }
    console.log('✅ Data saved to cache:', data.length, 'transactions')
  } catch (err) {
    console.error('Failed to save to cache:', err)
  }
}

const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    
    if (cached && timestamp) {
      const data = JSON.parse(cached)
      transactions.value = data
      lastUpdated.value = timestamp
      
      const cacheTime = new Date(timestamp).getTime()
      const now = new Date().getTime()
      const ageInMinutes = Math.floor((now - cacheTime) / 60000)
      
      if (ageInMinutes < 5) {
        cacheStatus.value = { type: 'cached', text: 'Cached data' }
      } else {
        cacheStatus.value = { type: 'stale', text: 'Stale data' }
      }
      
      totalPages.value = Math.ceil(data.length / itemsPerPage.value)
      console.log('✅ Loaded from cache:', data.length, 'transactions, age:', ageInMinutes, 'minutes')
      return true
    }
  } catch (err) {
    console.error('Failed to load from cache:', err)
  }
  return false
}

// ============== API CALLS ==============
const fetchFromAPI = async (forceRefresh = false) => {
  console.log('📡 Fetching from API...')
  
  loading.value = true
  if (forceRefresh) refreshing.value = true
  error.value = null
  
  try {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        size: 100,
        page: "0"
      })
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      const content = data.data.content || []
      transactions.value = content
      totalPages.value = Math.ceil(content.length / itemsPerPage.value)
      saveToCache(content)
      
      if (forceRefresh) {
        notification.success('Data refreshed successfully')
      }
      
      console.log('✅ API fetch successful:', content.length, 'transactions')
    } else {
      throw new Error(data.message || 'Failed to fetch transactions')
    }
  } catch (err) {
    error.value = err.message
    notification.error(err.message)
    console.error('❌ API fetch failed:', err)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// ============== INITIALIZATION ==============
onMounted(() => {
  console.log('🚀 Component mounted')
  const hasCache = loadFromCache()
  if (!hasCache) {
    console.log('No cache found, fetching from API...')
    fetchFromAPI(false)
  } else {
    console.log('Cache found, using cached data (NO API CALL)')
  }
})

// ============== CRUD OPERATIONS ==============
const createTransaction = async () => {
  try {
    const token = getAuthToken()
    
    // Set default lot_size to 0.01 if not provided or if it's empty
    const lotSize = form.lot_size && !isNaN(parseFloat(form.lot_size)) 
      ? parseFloat(form.lot_size) 
      : 0.01
    
    const payload = {
      symbol: form.symbol || '', // Include symbol (required)
      currency: form.currency,    // Required
      lot_size: lotSize,          // Required with default 0.01
      pnl: parseFloat(form.pnl),  // Required
      type: form.type.toLowerCase() // Required
    }
    
    // Add optional date if provided
    if (form.date) {
      const [year, month, day] = form.date.split('-')
      payload.inp_date = `${month}/${day}/${year}`
    }
    
    console.log('📤 Creating transaction with payload:', payload)
    
    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      notification.success('Transaction created successfully')
      await fetchFromAPI(true)
      return true
    } else {
      throw new Error(data.message || 'Failed to create transaction')
    }
  } catch (err) {
    notification.error(err.message)
    throw err
  }
}

const updateTransaction = async () => {
  try {
    const token = getAuthToken()
    
    const payload = { sn: form.sn }
    if (form.symbol) payload.symbol = form.symbol
    if (form.lot_size) payload.lot_size = parseFloat(form.lot_size).toString()
    if (form.currency) payload.currency = form.currency
    if (form.pnl) payload.pnl = parseFloat(form.pnl)
    
    const response = await fetch(`${API_BASE_URL}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      notification.success('Transaction updated successfully')
      await fetchFromAPI(true)
      return true
    } else {
      throw new Error(data.message || 'Failed to update transaction')
    }
  } catch (err) {
    notification.error(err.message)
    throw err
  }
}

const deleteTransaction = async () => {
  try {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sn: selectedTransaction.value.sn })
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      notification.success('Transaction deleted successfully')
      await fetchFromAPI(true)
      return true
    } else {
      throw new Error(data.message || 'Failed to delete transaction')
    }
  } catch (err) {
    notification.error(err.message)
    throw err
  }
}

// ============== UI HANDLERS ==============
const handleRefresh = async () => {
  await fetchFromAPI(true)
}

const applyFilters = () => {
  currentPage.value = 1
}

const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
const debouncedApplyFilters = debounce(applyFilters, 500)

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const resetFilters = () => {
  filters.symbol = ''
  filters.type = ''
  filters.currency = ''
  filters.date = ''
  currentPage.value = 1
}

// ============== COMPUTED ==============
const filteredTransactions = computed(() => {
  return transactions.value.filter(t => {
    if (filters.symbol && !t.symbol?.toLowerCase().includes(filters.symbol.toLowerCase())) return false
    if (filters.type && t.type !== filters.type) return false
    if (filters.currency && t.currency !== filters.currency) return false
    if (filters.date) {
      const tDate = new Date(t.date).toISOString().split('T')[0]
      if (tDate !== filters.date) return false
    }
    return true
  })
})

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTransactions.value.slice(start, end)
})

const summary = computed(() => {
  const totalProfit = transactions.value
    .filter(t => t.type === 'PROFIT')
    .reduce((sum, t) => sum + t.pnl, 0)
  
  const totalLoss = transactions.value
    .filter(t => t.type === 'LOSS')
    .reduce((sum, t) => sum + t.pnl, 0)
  
  return {
    totalProfit,
    totalLoss,
    netPnL: totalProfit - totalLoss,
    totalCount: transactions.value.length
  }
})

const hasActiveFilters = computed(() => {
  return filters.symbol || filters.type || filters.currency || filters.date
})

// ============== FORMATTERS ==============
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0)
}

const formatTransactionAmount = (transaction) => {
  if (!transaction) return '-'
  const amount = transaction.pnl || 0
  
  if (transaction.type === 'PROFIT' || transaction.type === 'LOSS') {
    return formatCurrency(amount)
  }
  
  return `${formatCurrency(amount)} ${transaction.currency}`
}

const getAmountClass = (transaction) => {
  if (!transaction) return ''
  if (transaction.type === 'PROFIT' || transaction.type === 'DEPOSIT') return 'profit'
  if (transaction.type === 'LOSS' || transaction.type === 'WITHDRAWAL') return 'loss'
  return ''
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return ''
  
  const now = new Date()
  const diffMs = now - new Date(timestamp)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

const getProfitClass = (value) => {
  if (value > 0) return 'profit'
  if (value < 0) return 'loss'
  return ''
}

// ============== MODAL HANDLERS ==============
const openCreateModal = () => {
  modalMode.value = 'create'
  form.sn = null
  form.symbol = ''
  form.type = ''
  form.lot_size = ''
  form.pnl = ''
  form.currency = ''
  form.date = ''
  showTransactionModal.value = true
}

const openEditModal = (transaction) => {
  modalMode.value = 'edit'
  selectedTransaction.value = transaction
  form.sn = transaction.sn
  form.symbol = transaction.symbol || ''
  form.type = transaction.type
  form.lot_size = transaction.lot_size || ''
  form.pnl = transaction.pnl
  form.currency = transaction.currency
  form.date = formatDateForInput(transaction.date)
  showTransactionModal.value = true
}

const confirmDelete = (transaction) => {
  selectedTransaction.value = transaction
  showDeleteModal.value = true
}

const closeModal = () => {
  showTransactionModal.value = false
  form.sn = null
  form.symbol = ''
  form.type = ''
  form.lot_size = ''
  form.pnl = ''
  form.currency = ''
  form.date = ''
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedTransaction.value = null
}

// ============== FORM SUBMISSIONS ==============
const handleSubmit = async () => {
  // Validation
  if (isTradingType.value && !form.symbol) {
    notification.error('Please select a symbol for trading transactions')
    return
  }
  
  if (isTradingType.value && !form.lot_size) {
    notification.error('Please enter lot size for trading transactions')
    return
  }
  
  submitting.value = true
  
  try {
    if (modalMode.value === 'create') {
      await createTransaction()
    } else {
      await updateTransaction()
    }
    closeModal()
  } catch (err) {
    // Error handled in API calls
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  submitting.value = true
  
  try {
    await deleteTransaction()
    closeDeleteModal()
  } catch (err) {
    // Error handled in API call
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.radio-label.deposit {
  background: #dbeafe;
  color: #1e40af;
}

.radio-label.withdrawal {
  background: #fef3c7;
  color: #92400e;
}

.dark .radio-label.deposit {
  background: #1e3a8a;
  color: #93c5fd;
}

.dark .radio-label.withdrawal {
  background: #78350f;
  color: #fcd34d;
}

/* Type badge styles for deposit/withdrawal */
.type-badge.deposit {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.withdrawal {
  background: #fef3c7;
  color: #92400e;
}

.dark .type-badge.deposit {
  background: #1e3a8a;
  color: #93c5fd;
}

.dark .type-badge.withdrawal {
  background: #78350f;
  color: #fcd34d;
}

.transaction-page {
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

/* Action Bar */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 12px;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cache-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 500;
}

.cache-status.cached {
  background: #d1fae5;
  color: #059669;
}

.cache-status.stale {
  background: #fef3c7;
  color: #d97706;
}

.cache-status.fresh {
  background: #dbeafe;
  color: #2563eb;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cache-status.cached .status-dot {
  background: #059669;
}

.cache-status.stale .status-dot {
  background: #d97706;
}

.cache-status.fresh .status-dot {
  background: #2563eb;
}

.cache-time {
  font-size: 9px;
  opacity: 0.8;
}

.last-updated {
  font-size: 9px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 20px;
}

.dark .last-updated {
  background: #374151;
  color: #9ca3af;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-icon {
  font-size: 14px;
  line-height: 1;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d5db;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-refresh {
  background: #10b981;
  color: white;
  min-width: 90px;
}

.btn-refresh:hover:not(:disabled) {
  background: #059669;
}

.btn-refresh:disabled {
  opacity: 0.7;
  cursor: wait;
}

.btn-refresh.refreshing {
  background: #6b7280;
}

.refresh-icon {
  display: inline-block;
  font-size: 14px;
  transition: transform 0.3s ease;
}

.refresh-icon.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Filter Bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .filter-bar {
  background: #1f2937;
}

.filter-group {
  flex: 1;
  min-width: 140px;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 10px;
  background: white;
  color: #1f2937;
}

.dark .filter-input,
.dark .filter-select {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .summary-card {
  background: #1f2937;
}

.card-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 18px;
}

.dark .card-icon {
  background: #374151;
}

.card-icon.profit {
  background: #d1fae5;
  color: #059669;
}

.card-icon.loss {
  background: #fee2e2;
  color: #dc2626;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 9px;
  color: #6b7280;
  margin-bottom: 2px;
}

.card-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.dark .card-value {
  color: white;
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .table-container {
  background: #1f2937;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 16px;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
  font-size: 10px;
}

.transactions-table th {
  background: #f9fafb;
  padding: 10px;
  text-align: left;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.dark .transactions-table th {
  background: #111827;
  color: #9ca3af;
  border-bottom-color: #374151;
}

.transactions-table td {
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}

.dark .transactions-table td {
  border-bottom-color: #374151;
  color: #e5e7eb;
}

.transactions-table tr:hover {
  background: #f9fafb;
}

.dark .transactions-table tr:hover {
  background: #111827;
}

.sn-cell {
  font-weight: 600;
  color: #3b82f6;
}

.symbol-badge {
  display: inline-block;
  padding: 3px 8px;
  background: #f3f4f6;
  border-radius: 12px;
  font-weight: 500;
  color: #374151;
}

.dark .symbol-badge {
  background: #374151;
  color: #e5e7eb;
}

.type-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 500;
}

.type-badge.profit {
  background: #d1fae5;
  color: #059669;
}

.type-badge.loss {
  background: #fee2e2;
  color: #dc2626;
}

.dark .type-badge.profit {
  background: #064e3b;
  color: #a7f3d0;
}

.dark .type-badge.loss {
  background: #7f1d1d;
  color: #fecaca;
}

.date-cell {
  white-space: nowrap;
  font-size: 9px;
  color: #6b7280;
}

.actions-cell {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.action-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn.edit {
  background: #dbeafe;
  color: #1e40af;
}

.action-btn.edit:hover {
  background: #bfdbfe;
}

.action-btn.delete {
  background: #fee2e2;
  color: #b91c1c;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.dark .action-btn.edit {
  background: #1e3a8a;
  color: #93c5fd;
}

.dark .action-btn.delete {
  background: #7f1d1d;
  color: #fecaca;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.dark .pagination {
  border-top-color: #374151;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dark .pagination-btn {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.page-info {
  font-size: 10px;
  color: #6b7280;
}

/* Profit/Loss Colors */
.profit {
  color: #10b981;
  font-weight: 500;
}

.loss {
  color: #ef4444;
  font-weight: 500;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.dark .modal-content {
  background: #1f2937;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: inherit;
  border-radius: 10px 10px 0 0;
}

.dark .modal-header {
  border-bottom-color: #374151;
}

.modal-header h2 {
  margin: 0;
  font-size: 15px;
  color: #1f2937;
}

.dark .modal-header h2 {
  color: white;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}

.close-btn:hover {
  color: #374151;
}

.modal-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #374151;
}

.dark .form-group label {
  color: #e5e7eb;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 11px;
  background: white;
  color: #1f2937;
}

.dark .form-input,
.dark .form-select {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.radio-group {
  display: flex;
  gap: 16px;
  padding: 4px 0;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  margin: 0;
  cursor: pointer;
}

.radio-label {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 16px;
}

.radio-label.profit {
  background: #d1fae5;
  color: #059669;
}

.radio-label.loss {
  background: #fee2e2;
  color: #dc2626;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 9px;
  color: #6b7280;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* Delete Modal */
.confirm-delete {
  max-width: 400px;
}

.delete-content {
  padding: 24px 20px;
  text-align: center;
}

.delete-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.delete-message {
  margin: 0 0 8px;
  font-size: 12px;
  color: #374151;
}

.dark .delete-message {
  color: #e5e7eb;
}

.warning {
  color: #ef4444;
  font-size: 10px;
  margin: 0;
}

/* Loading States */
.loading-state {
  text-align: center;
  padding: 48px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .loading-state {
  background: #1f2937;
}

.spinner {
  width: 32px;
  height: 32px;
  margin: 0 auto 12px;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 48px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .error-state {
  background: #1f2937;
}

.error-message {
  color: #ef4444;
  margin-bottom: 12px;
  font-size: 12px;
}

.btn-retry {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 11px;
}

/* No Data State */
.no-data {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .no-data {
  background: #1f2937;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.no-data h3 {
  margin: 0 0 6px;
  font-size: 15px;
  color: #1f2937;
}

.dark .no-data h3 {
  color: white;
}

.no-data p {
  margin: 0 0 16px;
  font-size: 11px;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-group {
    justify-content: space-between;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .actions-cell {
    flex-wrap: wrap;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
  
  .action-group {
    flex-direction: column;
    gap: 8px;
  }
  
  .last-updated {
    text-align: center;
  }
  
  .btn-refresh {
    width: 100%;
    justify-content: center;
  }
}

/* Touch Improvements */
@media (hover: none) and (pointer: coarse) {
  .btn,
  .filter-input,
  .filter-select,
  .pagination-btn,
  .action-btn {
    padding: 12px;
    font-size: 14px;
  }
  
  .action-btn {
    width: 40px;
    height: 40px;
  }
  
  .transactions-table td {
    padding: 15px 10px;
  }
}
</style>