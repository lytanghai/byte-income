<template>
  <div class="polymarket-events">
    <!-- <h2>Polymarket Events</h2> -->
    
    <!-- Filter Builder Section -->
    <div class="filter-builder">
      <!-- <h3>🔍 Build Your Custom Filter</h3> -->
      <h2>PolyMarket Events</h2>
      <div class="filter-controls">
        <!-- Keyword Search -->
        <div class="filter-group">
          <label>Keyword Search:</label>
          <input 
            v-model="filters.keyword" 
            type="text" 
            placeholder="e.g., FOMC, Iran, Trump, Crime"
            class="filter-input"
          />
        </div>
        
        <!-- Topic/Category Filter -->
        <div class="filter-group">
          <label>Topic Category:</label>
          <select v-model="filters.topic" class="filter-select">
            <option value="">All Topics</option>
            <option value="2">🌍 Politics / War / Crime</option>
            <option value="4">🏦 FOMC / Economy / Fed</option>
            <option value="3">📊 Economics</option>
            <option value="5">💼 Business</option>
            <option value="1">🎭 Pop Culture</option>
            <option value="6">⚡ Crypto</option>
          </select>
        </div>
        
        <!-- Date Range - Improved Layout -->
        <div class="filter-group date-range-group">
          <label>Date Range:</label>
          <div class="date-range-container">
            <div class="date-field">
              <input 
                type="date" 
                v-model="filters.dateFrom" 
                class="date-input"
              />
            </div>
            <div class="date-separator">→</div>
            <div class="date-field">
              <input 
                type="date" 
                v-model="filters.dateTo" 
                class="date-input"
              />
            </div>
          </div>
        </div>
        
        <!-- Preset Date Ranges -->
        <div class="filter-group">
          <label>Quick Range:</label>
          <select v-model="filters.presetRange" @change="applyPresetRange" class="filter-select">
            <option value="">Custom</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
          </select>
        </div>
        
        <!-- Sort Order -->
        <div class="filter-group">
          <label>Sort By:</label>
          <select v-model="filters.sortBy" class="filter-select">
            <option value="startDate">📅 Newest First</option>
            <option value="volume24hr">🔥 Trending (24h Volume)</option>
            <option value="volume">💰 Highest Volume</option>
            <option value="liquidity">💧 Most Liquid</option>
          </select>
        </div>
        
        <!-- Limit -->
        <div class="filter-group">
          <label>Results:</label>
          <select v-model="filters.limit" class="filter-select">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
      
      <!-- Submit Button -->
      <div class="submit-section">
        <button @click="submitFilters" class="submit-btn" :disabled="loading">
          <span v-if="loading">⏳ Loading...</span>
          <span v-else>Enter</span>
        </button>
        <button @click="clearAllFilters" class="reset-btn" type="button">
          Reset All Filters
        </button>
      </div>
      
      <!-- Generated URI Display (only shown after submit) -->
      <div class="uri-display" v-if="lastSubmittedUri">
        <label>📡 Last Generated API URI:</label>
        <div class="uri-box">
          <code>{{ lastSubmittedUri }}</code>
          <button @click="copyUri" class="copy-btn">📋 Copy</button>
        </div>
      </div>
      
      <!-- Active Filters Summary -->
      <div class="active-filters" v-if="activeFiltersCount">
        <span class="filter-badge" v-for="(value, key) in activeFilters" :key="key">
          {{ formatFilterLabel(key, value) }}
        </span>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Fetching events...
    </div>
    
    <!-- Error State -->
    <div v-if="error" class="error">Error: {{ error }}</div>
    
    <!-- Results Summary -->
    <div v-if="!loading && events.length" class="results-summary">
      Found <strong>{{ events.length }}</strong> events
      <span v-if="lastSubmittedUri">for your filters</span>
    </div>
    
    <!-- Events List -->
    <div v-if="!loading && events.length" class="events-grid">
      <div v-for="event in events" :key="event.id" class="event-card">
        <img 
          v-if="event.icon" 
          :src="event.icon" 
          :alt="event.title" 
          class="event-icon"
          @error="e => e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'"
        />
        <div class="event-details">
          <h3 v-html="highlightText(event.title, filters.keyword)"></h3>
          <p class="description" v-html="highlightText(truncateText(event.description, 120), filters.keyword)"></p>
          
          <div class="event-meta">
            <span class="category">{{ event.category || 'General' }}</span>
            <span class="volume">💰 ${{ formatVolume(event.volume24hr || event.volume) }}</span>
            <span class="date">📅 {{ formatDate(event.startDate) }}</span>
          </div>
          <div class="markets-preview">
            <strong>{{ event.markets?.length || 0 }} market(s)</strong>
            <a v-if="event.slug" :href="`https://polymarket.com/event/${event.slug}`" target="_blank" class="event-link">View →</a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Results -->
    <div v-if="!loading && !events.length && !error && hasSubmitted" class="no-results">
      <p>🔍 No events found with the selected filters.</p>
      <p class="suggestion">Try adjusting your search criteria or clearing filters.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Filter state
const filters = ref({
  keyword: '',
  topic: '',
  dateFrom: '',
  dateTo: '',
  presetRange: '',
  sortBy: 'startDate',
  limit: '50'
})

// UI State
const events = ref([])
const loading = ref(false)
const error = ref(null)
const lastSubmittedUri = ref('')
const hasSubmitted = ref(false)

// Helper: Format date for API (YYYY-MM-DD)
const formatDateForApi = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Helper: Get date X days ago
const getDateDaysAgo = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatDateForApi(date)
}

// Apply preset date ranges
const applyPresetRange = () => {
  const today = formatDateForApi(new Date())
  
  switch (filters.value.presetRange) {
    case 'today':
      filters.value.dateFrom = today
      filters.value.dateTo = today
      break
    case 'week':
      filters.value.dateFrom = getDateDaysAgo(7)
      filters.value.dateTo = today
      break
    case 'month':
      filters.value.dateFrom = getDateDaysAgo(30)
      filters.value.dateTo = today
      break
    case '3months':
      filters.value.dateFrom = getDateDaysAgo(90)
      filters.value.dateTo = today
      break
    default:
      // Keep custom dates
      break
  }
}

// Build the Polymarket API URI based on filters
const buildUri = () => {
  let endpoint = '/events'
  const params = new URLSearchParams()
  
  // Add date range filters
  if (filters.value.dateFrom) {
    params.append('startDate_min', `${filters.value.dateFrom}T00:00:00Z`)
  }
  if (filters.value.dateTo) {
    params.append('startDate_max', `${filters.value.dateTo}T23:59:59Z`)
  }
  
  // Add topic filter
  if (filters.value.topic) {
    params.append('tag_id', filters.value.topic)
    params.append('related_tags', 'true')
  }
  
  // Add sorting
  if (filters.value.sortBy) {
    params.append('order', filters.value.sortBy)
    params.append('ascending', 'false')
  }
  
  // Add limit
  if (filters.value.limit) {
    params.append('limit', filters.value.limit)
  }
  
  // Add active filter (only show active markets by default)
  params.append('active', 'true')
  params.append('closed', 'false')
  
  // Build the URL
  let uri = `${endpoint}?${params.toString()}`
  
  // If keyword search is used, switch to search endpoint
  if (filters.value.keyword && filters.value.keyword.trim()) {
    uri = `/public-search?q=${encodeURIComponent(filters.value.keyword)}&limit_per_type=${filters.value.limit || 50}`
  }
  
  return `https://gamma-api.polymarket.com${uri}`
}

// Count active filters
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.keyword) count++
  if (filters.value.topic) count++
  if (filters.value.dateFrom) count++
  if (filters.value.dateTo) count++
  if (filters.value.sortBy !== 'startDate') count++
  if (filters.value.limit !== '50') count++
  return count
})

// Get active filters for display
const activeFilters = computed(() => {
  const active = {}
  if (filters.value.keyword) active.keyword = filters.value.keyword
  if (filters.value.topic) active.topic = filters.value.topic
  if (filters.value.dateFrom) active.dateFrom = filters.value.dateFrom
  if (filters.value.dateTo) active.dateTo = filters.value.dateTo
  if (filters.value.sortBy !== 'startDate') active.sortBy = filters.value.sortBy
  if (filters.value.limit !== '50') active.limit = filters.value.limit
  return active
})

// Format filter label for display
const formatFilterLabel = (key, value) => {
  const labels = {
    keyword: `🔍 ${value}`,
    topic: getTopicLabel(value),
    dateFrom: `📅 From: ${value}`,
    dateTo: `📅 To: ${value}`,
    sortBy: `📊 Sort: ${getSortLabel(value)}`,
    limit: `📄 Limit: ${value}`
  }
  return labels[key] || `${key}: ${value}`
}

// Get topic label from ID
const getTopicLabel = (topicId) => {
  const topics = {
    '2': '🌍 Politics/War/Crime',
    '4': '🏦 FOMC/Economy',
    '3': '📊 Economics',
    '5': '💼 Business',
    '1': '🎭 Pop Culture',
    '6': '⚡ Crypto'
  }
  return topics[topicId] || topicId
}

// Get sort label
const getSortLabel = (sortValue) => {
  const sorts = {
    'startDate': 'Newest First',
    'volume24hr': 'Trending',
    'volume': 'Highest Volume',
    'liquidity': 'Most Liquid'
  }
  return sorts[sortValue] || sortValue
}

// Clear all filters
const clearAllFilters = () => {
  filters.value = {
    keyword: '',
    topic: '',
    dateFrom: '',
    dateTo: '',
    presetRange: '',
    sortBy: 'startDate',
    limit: '50'
  }
  events.value = []
  lastSubmittedUri.value = ''
  hasSubmitted.value = false
  error.value = null
}

// Copy URI to clipboard
const copyUri = async () => {
  try {
    await navigator.clipboard.writeText(lastSubmittedUri.value)
    alert('URI copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Extract events from various response formats
const extractEventsFromResponse = (data) => {
  if (data.events && Array.isArray(data.events)) return data.events
  if (data.data && Array.isArray(data.data)) return data.data
  if (data.result && Array.isArray(data.result)) return data.result
  if (Array.isArray(data)) return data
  if (data.id || data.title) return [data]
  return []
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/polymarket/request'

// Submit filters and fetch events
const submitFilters = async () => {
  loading.value = true
  error.value = null
  hasSubmitted.value = true
  
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No authentication token found')
    }
    
    const uri = buildUri()
    lastSubmittedUri.value = uri
    
    console.log('Submitting filters with URI:', uri)
    
  
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        method: 'GET',
        url: uri,
        body: { default: true }
      }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('API Response:', data)
    
    events.value = extractEventsFromResponse(data)
    console.log(`Loaded ${events.value.length} events`)
    
    if (events.value.length === 0) {
      console.warn('No events found for the selected filters')
    }
    
  } catch (err) {
    console.error('Fetch error:', err)
    error.value = err.message || 'Failed to load events'
    events.value = []
  } finally {
    loading.value = false
  }
}

// Helper functions for display
const truncateText = (text, limit) => {
  if (!text) return ''
  return text.length > limit ? text.substring(0, limit) + '...' : text
}

const highlightText = (text, keyword) => {
  if (!keyword || !text) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

const formatVolume = (volume) => {
  if (!volume) return '0'
  if (volume >= 1000000) return (volume / 1000000).toFixed(1) + 'M'
  if (volume >= 1000) return (volume / 1000).toFixed(1) + 'K'
  return volume.toFixed(2)
}

const formatDate = (dateString) => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Set default date range to last 30 days on mount
const initializeDefaults = () => {
  const today = formatDateForApi(new Date())
  const thirtyDaysAgo = getDateDaysAgo(30)
  filters.value.dateFrom = thirtyDaysAgo
  filters.value.dateTo = today
  filters.value.presetRange = 'month'
}

// Initialize on mount
initializeDefaults()
</script>

<style scoped>
@import '../assets/styles/polymarket.css';
</style>