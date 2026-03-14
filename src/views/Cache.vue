<template>
  <div class="cache-management">
    <div class="page-header">
      <h1>Cache Management</h1>
      <p class="subtitle">View and manage application cache with expiration</p>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon total">💾</div>
        <div class="card-content">
          <span class="card-label">Total Cache</span>
          <span class="card-value">{{ cacheStats.total }}</span>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon valid">✅</div>
        <div class="card-content">
          <span class="card-label">Valid</span>
          <span class="card-value">{{ cacheStats.valid }}</span>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon expired">⏰</div>
        <div class="card-content">
          <span class="card-label">Expired</span>
          <span class="card-value">{{ cacheStats.expired }}</span>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon size">📦</div>
        <div class="card-content">
          <span class="card-label">Size</span>
          <span class="card-value">{{ formatBytes(cacheStats.size) }}</span>
        </div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="controls">
      <button @click="refreshCache" class="btn btn-primary" :disabled="isLoading">
        <span class="btn-icon">🔄</span>
        {{ isLoading ? 'Refreshing...' : 'Refresh Cache' }}
      </button>
      
      <button @click="cleanExpired" class="btn btn-warning" :disabled="isCleaning || cacheStats.expired === 0">
        <span class="btn-icon">🧹</span>
        {{ isCleaning ? 'Cleaning...' : 'Clean Expired' }}
      </button>
      
      <button @click="clearAllCache" class="btn btn-danger" :disabled="isClearing || cacheStats.total === 0">
        <span class="btn-icon">🗑️</span>
        {{ isClearing ? 'Clearing...' : 'Clear All Cache' }}
      </button>
    </div>

    <!-- Cache Expiration Settings -->
    <div class="settings-section">
      <h3>Default Expiration Settings</h3>
      <div class="settings-grid">
        <div class="setting-item">
          <label>Transactions Cache</label>
          <select v-model="expirySettings.transactions" class="expiry-select">
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="360">6 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>Performance Cache</label>
          <select v-model="expirySettings.performance" class="expiry-select">
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="360">6 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>Insight Cache</label>
          <select v-model="expirySettings.insight" class="expiry-select">
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="360">6 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>Notification Cache</label>
          <select v-model="expirySettings.notification" class="expiry-select">
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="360">6 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Cache Items Table -->
    <div class="table-container">
      <div class="table-header">
        <h3>Cache Items ({{ filteredCache.length }})</h3>
        <div class="table-filters">
          <select v-model="filterStatus" class="filter-select">
            <option value="">All Status</option>
            <option value="valid">Valid</option>
            <option value="expired">Expired</option>
          </select>
          
          <input 
            v-model="searchQuery" 
            placeholder="Search..."
            class="filter-input"
          />
        </div>
      </div>

      <div class="table-responsive">
        <table class="cache-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Status</th>
              <th>Expires In</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredCache.length === 0">
              <td colspan="5" class="no-data">No cache items found</td>
            </tr>
            <tr v-for="item in paginatedCache" :key="item.key" class="cache-row">
              <td class="key-cell" :title="item.key">
                {{ truncateKey(item.key) }}
              </td>
              <td>
                <span class="status-badge" :class="item.status">
                  {{ item.status }}
                </span>
              </td>
              <td class="expiry-cell" :class="item.status">
                {{ formatExpiry(item.expiresIn) }}
              </td>
              <td class="size-cell">{{ formatBytes(item.size) }}</td>
              <td class="actions-cell">
                <button @click="viewItemDetails(item)" class="action-btn view" title="View">
                  👁️
                </button>
                <button @click="deleteCacheItem(item.key)" class="action-btn delete" title="Delete">
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
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ← Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Item Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Cache Item Details</h2>
          <button class="close-btn" @click="closeDetailsModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">Key:</span>
            <span class="detail-value">{{ selectedItem?.key }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">
              <span class="status-badge" :class="selectedItem?.status">
                {{ selectedItem?.status }}
              </span>
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Expires In:</span>
            <span class="detail-value" :class="selectedItem?.status">
              {{ formatExpiry(selectedItem?.expiresIn) }}
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Size:</span>
            <span class="detail-value">{{ formatBytes(selectedItem?.size || 0) }}</span>
          </div>
          
          <div class="detail-row value-row">
            <span class="detail-label">Value:</span>
            <pre class="value-preview">{{ selectedItem?.displayValue }}</pre>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="copyToClipboard(selectedItem?.displayValue)">
            Copy Value
          </button>
          <button class="btn btn-danger" @click="deleteCacheItem(selectedItem?.key); closeDetailsModal()">
            Delete Item
          </button>
          <button class="btn btn-primary" @click="closeDetailsModal">Close</button>
        </div>
      </div>
    </div>

    <!-- Confirm Clear Modal -->
    <div v-if="showClearModal" class="modal-overlay" @click="closeClearModal">
      <div class="modal-content confirm-delete" @click.stop>
        <div class="modal-header">
          <h2>Confirm Clear Cache</h2>
          <button class="close-btn" @click="closeClearModal">✕</button>
        </div>
        
        <div class="delete-content">
          <div class="delete-icon">⚠️</div>
          <p class="delete-message">
            Are you sure you want to clear ALL cache?
          </p>
          <p class="warning">This action cannot be undone!</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeClearModal">Cancel</button>
          <button class="btn btn-danger" @click="confirmClear" :disabled="isClearing">
            <span v-if="isClearing" class="spinner-small"></span>
            {{ isClearing ? 'Clearing...' : 'Confirm Clear' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useNotification } from '../composables/useNotification'
import { useCache } from '../composables/useCache'

const notification = useNotification()
const { getCacheStats, cleanExpiredCache, clearAllCache: clearAll } = useCache()

// ============== STATE ==============
const cacheItems = ref([])
const isLoading = ref(false)
const isCleaning = ref(false)
const isClearing = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showDetailsModal = ref(false)
const showClearModal = ref(false)
const selectedItem = ref(null)
const searchQuery = ref('')
const filterStatus = ref('')

// Cache statistics
const cacheStats = ref({
  total: 0,
  valid: 0,
  expired: 0,
  size: 0
})

// Expiration settings
const expirySettings = reactive({
  transactions: '5',
  performance: '5',
  insight: '5',
  notification: '5'
})

// Protected keys
const protectedKeys = ['authToken', 'isAuthenticated', 'userData', 'theme']

// ============== COMPUTED ==============
const filteredCache = computed(() => {
  return cacheItems.value.filter(item => {
    // Search filter
    if (searchQuery.value && !item.key.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false
    }
    
    // Status filter
    if (filterStatus.value && item.status !== filterStatus.value) {
      return false
    }
    
    return true
  })
})

const paginatedCache = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCache.value.slice(start, end)
})

const totalPages = computed(() => 
  Math.ceil(filteredCache.value.length / itemsPerPage.value)
)

// ============== HELPER FUNCTIONS ==============
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatExpiry = (seconds) => {
  if (!seconds) return 'Unknown'
  if (seconds < 0) return 'Expired'
  if (seconds < 60) return `${Math.floor(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

const truncateKey = (key, maxLength = 40) => {
  if (key.length <= maxLength) return key
  return key.substring(0, maxLength) + '...'
}

const parseCacheItem = (key, value) => {
  try {
    const parsed = JSON.parse(value)
    const size = new Blob([value]).size
    const now = Date.now()
    let expiresIn = null
    let status = 'unknown'
    
    // Check for expiry
    const expiryKey = key + '_expiry'
    const expiry = localStorage.getItem(expiryKey)
    
    if (expiry) {
      const expiryTime = parseInt(expiry)
      expiresIn = Math.floor((expiryTime - now) / 1000)
      
      if (now > expiryTime) {
        status = 'expired'
        // This item will be removed on next refresh
      } else {
        status = 'valid'
      }
    } else {
      status = 'permanent'
    }
    
    return {
      key,
      value: parsed,
      displayValue: typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : String(parsed),
      size,
      expiresIn,
      status
    }
  } catch {
    // Not JSON, store as string
    return {
      key,
      value,
      displayValue: value,
      size: new Blob([value]).size,
      status: 'permanent',
      expiresIn: null
    }
  }
}

// Auto-cleanup every minute
let cleanupInterval

onMounted(() => {
  refreshCache()
  
  // Run cleanup every minute
  cleanupInterval = setInterval(() => {
    const cleaned = cleanExpiredCache()
    if (cleaned > 0) {
      refreshCache() // Refresh view if items were cleaned
    }
  }, 60000) // 60 seconds
})

onUnmounted(() => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
})
// ============== CACHE OPERATIONS ==============
const refreshCache = () => {
  isLoading.value = true
  
  try {
    const items = []
    let expiredRemoved = 0
    
    // First, clean expired items from localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      
      // Check if this is an expiry key
      if (key.endsWith('_expiry')) {
        const expiry = localStorage.getItem(key)
        if (expiry) {
          const now = Date.now()
          const expiryTime = parseInt(expiry)
          
          if (now > expiryTime) {
            // Remove both the cache and its expiry
            const cacheKey = key.replace('_expiry', '')
            localStorage.removeItem(cacheKey)
            localStorage.removeItem(key)
            expiredRemoved++
          }
        }
      }
    }
    
    // Update stats
    cacheStats.value = getCacheStats()
    
    // Now collect remaining valid items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      // Skip protected keys and expiry keys
      if (protectedKeys.includes(key) || key.endsWith('_expiry')) {
        continue
      }
      
      const value = localStorage.getItem(key)
      
      if (key && value) {
        items.push(parseCacheItem(key, value))
      }
    }
    
    // Sort by key
    items.sort((a, b) => a.key.localeCompare(b.key))
    
    cacheItems.value = items
    
    if (expiredRemoved > 0) {
      notification.info(`Removed ${expiredRemoved} expired cache items`)
    }
    
    notification.success(`Loaded ${items.length} cache items`)
  } catch (err) {
    notification.error('Failed to load cache: ' + err.message)
  } finally {
    isLoading.value = false
  }
}

const cleanExpired = async () => {
  isCleaning.value = true
  
  try {
    const cleaned = cleanExpiredCache()
    refreshCache()
    notification.success(`Cleaned ${cleaned} expired cache items`)
  } catch (err) {
    notification.error('Failed to clean expired cache: ' + err.message)
  } finally {
    isCleaning.value = false
  }
}

const deleteCacheItem = (key) => {
  try {
    // Remove main cache and its expiry
    localStorage.removeItem(key)
    localStorage.removeItem(key + '_expiry')
    
    cacheItems.value = cacheItems.value.filter(item => item.key !== key)
    cacheStats.value = getCacheStats()
    notification.success(`Deleted: ${key}`)
    
    if (selectedItem.value?.key === key) {
      showDetailsModal.value = false
    }
  } catch (err) {
    notification.error('Failed to delete: ' + err.message)
  }
}

const clearAllCache = () => {
  showClearModal.value = true
}

const confirmClear = () => {
  isClearing.value = true
  
  try {
    const count = clearAll()
    refreshCache()
    notification.success(`Cleared ${count} cache items`)
    closeClearModal()
  } catch (err) {
    notification.error('Failed to clear cache: ' + err.message)
  } finally {
    isClearing.value = false
  }
}

const viewItemDetails = (item) => {
  selectedItem.value = item
  showDetailsModal.value = true
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    notification.success('Copied to clipboard')
  }).catch(() => {
    notification.error('Failed to copy')
  })
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedItem.value = null
}

const closeClearModal = () => {
  showClearModal.value = false
}

// ============== LIFECYCLE ==============
onMounted(() => {
  refreshCache()
})
</script>

<style scoped>
.card-icon.valid {
  background: #d1fae5;
  color: #059669;
}

.card-icon.expired {
  background: #fee2e2;
  color: #dc2626;
}

.settings-section {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .settings-section {
  background: #1f2937;
}

.settings-section h3 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #1f2937;
}

.dark .settings-section h3 {
  color: white;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item label {
  font-size: 10px;
  color: #6b7280;
}

.expiry-select {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 10px;
  background: white;
  color: #1f2937;
}

.dark .expiry-select {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.status-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 8px;
  font-weight: 500;
}

.status-badge.valid {
  background: #d1fae5;
  color: #059669;
}

.status-badge.expired {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.permanent {
  background: #f3f4f6;
  color: #6b7280;
}

.dark .status-badge.valid {
  background: #064e3b;
  color: #a7f3d0;
}

.dark .status-badge.expired {
  background: #7f1d1d;
  color: #fecaca;
}

.dark .status-badge.permanent {
  background: #374151;
  color: #9ca3af;
}

.expiry-cell {
  font-weight: 500;
}

.expiry-cell.valid {
  color: #10b981;
}

.expiry-cell.expired {
  color: #ef4444;
}
.cache-management {
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

.card-icon.total {
  background: #dbeafe;
  color: #2563eb;
}

.card-icon.size {
  background: #d1fae5;
  color: #059669;
}

.card-icon.user {
  background: #fee2e2;
  color: #dc2626;
}

.dark .card-icon {
  background: #374151;
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

/* Controls */
.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
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
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Stats Section */
.stats-section {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .stats-section {
  background: #1f2937;
}

.stat-group h3 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #1f2937;
}

.dark .stat-group h3 {
  color: white;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.dark .stat-item {
  background: #374151;
}

.stat-label {
  font-size: 8px;
  color: #6b7280;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.dark .stat-value {
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

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.table-header h3 {
  margin: 0;
  font-size: 13px;
  color: #1f2937;
}

.dark .table-header h3 {
  color: white;
}

.table-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-select,
.filter-input {
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 9px;
  background: white;
  color: #1f2937;
  min-width: 100px;
}

.dark .filter-select,
.dark .filter-input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.filter-input {
  min-width: 150px;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 16px;
}

.cache-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
  font-size: 10px;
}

.cache-table th {
  background: #f9fafb;
  padding: 8px;
  text-align: left;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.dark .cache-table th {
  background: #111827;
  color: #9ca3af;
  border-bottom-color: #374151;
}

.cache-table td {
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}

.dark .cache-table td {
  border-bottom-color: #374151;
  color: #e5e7eb;
}

.cache-row:hover {
  background: #f9fafb;
}

.dark .cache-row:hover {
  background: #111827;
}

.key-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
  font-size: 9px;
}

.key-preview {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 10px;
  padding: 2px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.copy-btn:hover {
  opacity: 1;
}

.value-cell {
  max-width: 200px;
}

.value-preview {
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 10px;
  padding: 2px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.view-btn:hover {
  opacity: 1;
}

.size-cell {
  font-family: monospace;
  white-space: nowrap;
}

.age-cell,
.expires-cell {
  white-space: nowrap;
  font-weight: 500;
}

.age-cell.fresh {
  color: #10b981;
}

.age-cell.recent {
  color: #f59e0b;
}

.age-cell.old {
  color: #ef4444;
}

.expires-cell.expired {
  color: #ef4444;
}

.expires-cell.expiring-soon {
  color: #f59e0b;
}

.type-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 8px;
  font-weight: 500;
}

.type-badge.user {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.transaction {
  background: #d1fae5;
  color: #059669;
}

.type-badge.performance {
  background: #fef3c7;
  color: #92400e;
}

.type-badge.insight {
  background: #e0f2fe;
  color: #0369a1;
}

.type-badge.notification {
  background: #fee2e2;
  color: #991b1b;
}

.type-badge.system {
  background: #f3f4f6;
  color: #6b7280;
}

.dark .type-badge.user {
  background: #1e3a8a;
  color: #93c5fd;
}

.dark .type-badge.transaction {
  background: #064e3b;
  color: #a7f3d0;
}

.dark .type-badge.performance {
  background: #78350f;
  color: #fcd34d;
}

.dark .type-badge.insight {
  background: #0c4a6e;
  color: #7dd3fc;
}

.dark .type-badge.notification {
  background: #7f1d1d;
  color: #fecaca;
}

.dark .type-badge.system {
  background: #374151;
  color: #9ca3af;
}

.actions-cell {
  display: flex;
  gap: 4px;
  white-space: nowrap;
}

.action-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.2s;
}

.action-btn.view {
  background: #e0f2fe;
  color: #0369a1;
}

.action-btn.view:hover {
  background: #bae6fd;
}

.action-btn.delete {
  background: #fee2e2;
  color: #b91c1c;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.dark .action-btn.view {
  background: #0c4a6e;
  color: #7dd3fc;
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
  padding: 4px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 9px;
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
  font-size: 9px;
  color: #6b7280;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* No Data */
.no-data {
  text-align: center;
  padding: 30px;
  color: #6b7280;
  font-size: 11px;
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
  max-width: 600px;
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

.modal-body {
  padding: 20px;
}

.detail-row {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
}

.detail-label {
  width: 80px;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
}

.detail-value {
  flex: 1;
  font-size: 11px;
  color: #1f2937;
  word-break: break-word;
}

.dark .detail-value {
  color: #e5e7eb;
}

.key-detail {
  font-family: monospace;
  font-size: 10px;
}

.value-row {
  margin-top: 16px;
}

.value-preview {
  flex: 1;
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 10px;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.dark .value-preview {
  background: #374151;
  color: #e5e7eb;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.dark .modal-footer {
  border-top-color: #374151;
}

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
  color: #ef4444 !important;
  font-size: 10px;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .table-filters {
    width: 100%;
  }
  
  .filter-select,
  .filter-input {
    flex: 1;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .modal-footer .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-cell {
    flex-wrap: wrap;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-label {
    width: 100%;
    margin-bottom: 4px;
  }
}
</style>