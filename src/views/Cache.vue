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
@import '../assets/styles/cache.css';

</style>