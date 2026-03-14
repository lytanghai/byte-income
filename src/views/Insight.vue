<template>
  <div class="insight-page">
    <!-- Header -->
    <div class="page-header">
      <h1>Market Insights</h1>
      <p class="subtitle">Real-time news and economic events</p>
    </div>

    <!-- Main Content -->
    <div class="content-wrapper">
      <!-- Left Sidebar - Filters -->
      <div class="filters-sidebar">
        <div class="filters-header">
          <h3>Filters</h3>
          <button v-if="hasActiveFilters" @click="resetFilters" class="reset-filters-btn">
            Reset All
          </button>
        </div>

        <!-- Category Filter -->
        <div class="filter-group">
          <label class="filter-label">Category</label>
          <select v-model="filters.category" @change="applyFilters" class="filter-select">
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <!-- Market Filter -->
        <div class="filter-group">
          <label class="filter-label">Market</label>
          <select v-model="filters.market" @change="applyFilters" class="filter-select">
            <option value="">All Markets</option>
            <option v-for="market in markets" :key="market" :value="market">
              {{ market }}
            </option>
          </select>
        </div>

        <!-- Impact Filter -->
        <div class="filter-group">
          <label class="filter-label">Impact</label>
          <div class="impact-options">
            <label class="impact-option">
              <input type="radio" v-model="filters.impact" value="" @change="applyFilters">
              <span>All</span>
            </label>
            <label class="impact-option">
              <input type="radio" v-model="filters.impact" value="High" @change="applyFilters">
              <span class="impact-high">High</span>
            </label>
            <label class="impact-option">
              <input type="radio" v-model="filters.impact" value="Medium" @change="applyFilters">
              <span class="impact-medium">Medium</span>
            </label>
            <label class="impact-option">
              <input type="radio" v-model="filters.impact" value="Low" @change="applyFilters">
              <span class="impact-low">Low</span>
            </label>
            <label class="impact-option">
              <input type="radio" v-model="filters.impact" value="Holiday" @change="applyFilters">
              <span class="impact-holiday">Holiday</span>
            </label>
          </div>
        </div>

        <!-- Country Filter -->
        <div class="filter-group">
          <label class="filter-label">Country/Currency</label>
          <select v-model="filters.country" @change="applyFilters" class="filter-select">
            <option value="">All Countries</option>
            <option v-for="country in countries" :key="country" :value="country">
              {{ country }}
            </option>
          </select>
        </div>

        <!-- Keyword Search -->
        <div class="filter-group">
          <label class="filter-label">Keyword</label>
          <div class="keyword-search">
            <input 
              type="text" 
              v-model="filters.keyword" 
              @input="debouncedApplyFilters"
              placeholder="Search in title..."
              class="keyword-input"
            />
            <button v-if="filters.keyword" @click="clearKeyword" class="clear-btn">✕</button>
          </div>
        </div>

        <!-- Source Filter -->
        <div class="filter-group">
          <label class="filter-label">Source</label>
          <select v-model="filters.source" @change="applyFilters" class="filter-select">
            <option value="">All Sources</option>
            <option v-for="source in sources" :key="source" :value="source">
              {{ source }}
            </option>
          </select>
        </div>

        <!-- Active Filters -->
        <div v-if="hasActiveFilters" class="active-filters">
          <div class="active-filters-title">Active Filters:</div>
          <div class="filter-tags">
            <span v-if="filters.category" class="filter-tag">
              {{ filters.category }}
              <button @click="filters.category = ''; applyFilters()">✕</button>
            </span>
            <span v-if="filters.market" class="filter-tag">
              {{ filters.market }}
              <button @click="filters.market = ''; applyFilters()">✕</button>
            </span>
            <span v-if="filters.impact" class="filter-tag">
              {{ filters.impact }}
              <button @click="filters.impact = ''; applyFilters()">✕</button>
            </span>
            <span v-if="filters.country" class="filter-tag">
              {{ filters.country }}
              <button @click="filters.country = ''; applyFilters()">✕</button>
            </span>
            <span v-if="filters.source" class="filter-tag">
              {{ filters.source }}
              <button @click="filters.source = ''; applyFilters()">✕</button>
            </span>
            <span v-if="filters.keyword" class="filter-tag">
              "{{ filters.keyword }}"
              <button @click="clearKeyword">✕</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Right Content - News Feed & Events -->
      <div class="main-content">
        <!-- Stats Bar -->
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-label">News Articles</span>
            <span class="stat-value">{{ totalNews }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Showing</span>
            <span class="stat-value">{{ filteredNews.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Events</span>
            <span class="stat-value">{{ events.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">High Impact</span>
            <span class="stat-value impact-high">{{ highImpactEvents }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Today's Events</span>
            <span class="stat-value">{{ todayEventsCount }}</span>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'news' }"
            @click="activeTab = 'news'"
          >
            News Feed
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'events' }"
            @click="activeTab = 'events'"
          >
            Forex Factory Calendar
          </button>
        </div>

        <!-- News Feed Tab -->
        <div v-show="activeTab === 'news'" class="news-feed">
          <!-- Loading State -->
          <div v-if="loading && allNews.length === 0" class="loading-state">
            <div class="spinner"></div>
            <p>Loading news...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <p class="error-message">{{ error }}</p>
            <button @click="fetchNews(true)" class="btn-retry">Retry</button>
          </div>

          <!-- News List -->
          <div v-else class="news-list">
            <div v-if="filteredNews.length === 0" class="no-data">
              No news articles match your filters
            </div>

            <div 
              v-for="(news, index) in paginatedNews" 
              :key="index" 
              class="news-card"
              :class="getImpactClass(news.impact)"
            >
              <!-- Card Header -->
              <div class="news-header">
                <div class="news-meta">
                  <span class="news-source" :class="getSourceClass(news.source)">
                    {{ news.source }}
                  </span>
                  <span class="news-category">{{ news.category }}</span>
                  <span class="news-impact" :class="getImpactClass(news.impact)">
                    {{ news.impact }}
                  </span>
                </div>
                <span class="news-time">{{ formatTimeAgo(news.published_at) }}</span>
              </div>

              <!-- Card Title -->
              <h3 class="news-title">
                <a :href="news.link" target="_blank" rel="noopener noreferrer">
                  {{ news.title }}
                </a>
              </h3>

              <!-- Card Description -->
              <p class="news-description" v-html="truncateDescription(news.description)"></p>

              <!-- Card Footer -->
              <div class="news-footer">
                <div class="market-tags">
                  <span 
                    v-for="tag in news.market_tags" 
                    :key="tag" 
                    class="market-tag"
                  >
                    {{ tag }}
                  </span>
                  <span v-if="news.market_tags.length === 0" class="no-tags">
                    No market tags
                  </span>
                </div>
                <a :href="news.link" target="_blank" rel="noopener noreferrer" class="read-more">
                  Read More →
                </a>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="filteredNews.length > 0" class="pagination">
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
        </div>

        <!-- Events Tab -->
        <div v-show="activeTab === 'events'" class="events-feed">
          <!-- Loading State -->
          <div v-if="eventsLoading && events.length === 0" class="loading-state">
            <div class="spinner"></div>
            <p>Loading economic calendar...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="eventsError" class="error-state">
            <p class="error-message">{{ eventsError }}</p>
            <button @click="fetchEvents(true)" class="btn-retry">Retry</button>
          </div>

          <!-- Events List -->
          <div v-else class="events-list">
            <div v-if="filteredEvents.length === 0" class="no-data">
              No economic events match your filters
            </div>

            <!-- Date Group - Sorted Descending (Present to Past) -->
            <div v-for="(group, date) in sortedEventGroups" :key="date" class="event-date-group">
              <div class="event-date-header">
                <h4>{{ formatEventDate(date) }}</h4>
                <span class="event-count">{{ group.length }} events</span>
              </div>

              <div 
                v-for="event in group" 
                :key="event.date + event.title" 
                class="event-card"
                :class="getEventImpactClass(event.impact)"
              >
                <div class="event-time">
                  {{ formatEventTime(event.date) }}
                  <!-- Countdown timer for today's events -->
                  <span v-if="isToday(date)" class="event-countdown">
                    {{ getCountdown(event.date) }}
                  </span>
                </div>

                <div class="event-content">
                  <div class="event-header">
                    <span class="event-country">{{ event.country }}</span>
                    <span class="event-impact" :class="getEventImpactClass(event.impact)">
                      {{ event.impact }}
                    </span>
                  </div>

                  <h4 class="event-title">{{ event.title }}</h4>

                  <div class="event-details">
                    <div class="event-detail">
                      <span class="detail-label">Forecast</span>
                      <span class="detail-value">{{ event.forecast || '-' }}</span>
                    </div>
                    <div class="event-detail">
                      <span class="detail-label">Previous</span>
                      <span class="detail-value">{{ event.previous || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useNotification } from '../composables/useNotification'
import { useCache } from '../composables/useCache'

const { setCache, getCache } = useCache()

const saveCacheData = (cacheName, data) => {
  setCache(cacheName, data, 5) // Expires in 5 minutes
}
// Initialize notification
const notification = useNotification()

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Cache keys for localStorage
const NEWS_CACHE_KEY = 'insight_news_cache'
const NEWS_TIMESTAMP_KEY = 'insight_news_timestamp'
const EVENTS_CACHE_KEY = 'insight_events_cache'
const EVENTS_TIMESTAMP_KEY = 'insight_events_timestamp'

// State
const allNews = ref([])
const events = ref([])
const loading = ref(false)
const eventsLoading = ref(false)
const error = ref(null)
const eventsError = ref(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const activeTab = ref('news')
const currentTime = ref(new Date())
let timerInterval = null

// Filters
const filters = reactive({
  category: '',
  market: '',
  impact: '',
  country: '',
  keyword: '',
  source: ''
})

// ============== CACHE MANAGEMENT ==============
const saveNewsToCache = (data) => {
  try {
    const cacheData = {
      data: data,
      filters: {
        category: filters.category,
        market: filters.market,
        impact: filters.impact,
        keyword: filters.keyword,
        source: filters.source
      }
    }
    saveCacheData(NEWS_CACHE_KEY, JSON.stringify(cacheData), 5)
    saveCacheData(NEWS_TIMESTAMP_KEY, new Date().toISOString(), 5)
    console.log('✅ News saved to cache')
  } catch (err) {
    console.error('Failed to save news to cache:', err)
  }
}

const loadNewsFromCache = () => {
  try {
    const cached = getCache(NEWS_CACHE_KEY)
    
    if (cached) {
      const cacheData = JSON.parse(cached)
      
      // Check if filters match
      if (cacheData.filters.category === filters.category &&
          cacheData.filters.market === filters.market &&
          cacheData.filters.impact === filters.impact &&
          cacheData.filters.keyword === filters.keyword &&
          cacheData.filters.source === filters.source) {
        
        allNews.value = cacheData.data
        console.log('✅ News loaded from cache')
        return true
      }
    }
  } catch (err) {
    console.error('Failed to load news from cache:', err)
  }
  return false
}

const saveEventsToCache = (data) => {
  try {
    const cacheData = {
      data: data,
      filters: {
        impact: filters.impact,
        country: filters.country,
        keyword: filters.keyword
      }
    }
    saveCacheData(EVENTS_CACHE_KEY, JSON.stringify(cacheData), 5)
    saveCacheData(EVENTS_TIMESTAMP_KEY, new Date().toISOString(), 5)

    console.log('✅ Events saved to cache')
  } catch (err) {
    console.error('Failed to save events to cache:', err)
  }
}

const loadEventsFromCache = () => {
  try {
    const cached = getCache(EVENTS_CACHE_KEY)
    
    if (cached) {
      const cacheData = JSON.parse(cached)
      
      // Check if filters match
      if (cacheData.filters.impact === filters.impact &&
          cacheData.filters.country === filters.country &&
          cacheData.filters.keyword === filters.keyword) {
        
        events.value = cacheData.data
        console.log('✅ Events loaded from cache')
        return true
      }
    }
  } catch (err) {
    console.error('Failed to load events from cache:', err)
  }
  return false
}

// Update current time every second
const startTimer = () => {
  timerInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
}

onMounted(() => {
  fetchNews()
  fetchEvents()
  startTimer()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

// Available filter options (computed from data)
const categories = computed(() => {
  const cats = new Set(allNews.value.map(n => n.category).filter(Boolean))
  return Array.from(cats).sort()
})

const markets = computed(() => {
  const mkts = new Set()
  allNews.value.forEach(news => {
    news.market_tags?.forEach(tag => mkts.add(tag))
  })
  return Array.from(mkts).sort()
})

const sources = computed(() => {
  const srcs = new Set(allNews.value.map(n => n.source).filter(Boolean))
  return Array.from(srcs).sort()
})

const countries = computed(() => {
  const cntrs = new Set(events.value.map(e => e.country).filter(Boolean))
  return Array.from(cntrs).sort()
})

// Filtered news
const filteredNews = computed(() => {
  return allNews.value.filter(news => {
    // Category filter
    if (filters.category && news.category !== filters.category) return false
    
    // Market filter
    if (filters.market && (!news.market_tags || !news.market_tags.includes(filters.market))) return false
    
    // Impact filter
    if (filters.impact && news.impact !== filters.impact) return false
    
    // Source filter
    if (filters.source && news.source !== filters.source) return false
    
    // Keyword search
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const titleMatch = news.title?.toLowerCase().includes(keyword)
      const descMatch = news.description?.toLowerCase().includes(keyword)
      if (!titleMatch && !descMatch) return false
    }
    
    return true
  })
})

// Filtered events
const filteredEvents = computed(() => {
  return events.value.filter(event => {
    // Impact filter
    if (filters.impact && event.impact !== filters.impact) return false
    
    // Country filter
    if (filters.country && event.country !== filters.country) return false
    
    // Keyword search
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const titleMatch = event.title?.toLowerCase().includes(keyword)
      if (!titleMatch) return false
    }
    
    return true
  })
})

// Parse date string (DD-MM-YYYY HH:MM:SS) to Date object
const parseEventDate = (dateStr) => {
  if (!dateStr) return new Date(0)
  const [datePart, timePart] = dateStr.split(' ')
  const [day, month, year] = datePart.split('-').map(Number)
  const [hours, minutes, seconds] = timePart ? timePart.split(':').map(Number) : [0, 0, 0]
  return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0)
}

// Check if date is today
const isToday = (dateStr) => {
  const today = new Date()
  const [day, month, year] = dateStr.split('-').map(Number)
  return day === today.getDate() && 
         month === today.getMonth() + 1 && 
         year === today.getFullYear()
}

// Get countdown time for event
const getCountdown = (dateTime) => {
  if (!dateTime) return ''
  
  const eventDate = parseEventDate(dateTime)
  const now = currentTime.value
  
  // If event already passed
  if (eventDate < now) {
    return 'Passed'
  }
  
  const diffMs = eventDate - now
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffHrs > 24) {
    const diffDays = Math.floor(diffHrs / 24)
    return `${diffDays}d ${diffHrs % 24}h`
  } else if (diffHrs > 0) {
    return `${diffHrs}h ${diffMins}m`
  } else if (diffMins > 0) {
    return `${diffMins}m`
  } else {
    return 'Now'
  }
}

// Group and sort events by date (descending)
const sortedEventGroups = computed(() => {
  // First, group events by date
  const groups = {}
  
  filteredEvents.value.forEach(event => {
    const date = event.date.split(' ')[0] // Get date part only
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
  })
  
  // Sort events within each date by time (ascending)
  Object.keys(groups).forEach(date => {
    groups[date].sort((a, b) => {
      const timeA = a.date.split(' ')[1] || ''
      const timeB = b.date.split(' ')[1] || ''
      return timeA.localeCompare(timeB)
    })
  })
  
  // Sort dates in descending order (present to past)
  const sortedDates = Object.keys(groups).sort((a, b) => {
    const dateA = parseEventDate(a + ' 00:00:00')
    const dateB = parseEventDate(b + ' 00:00:00')
    return dateB - dateA // Descending order
  })
  
  // Create new object with sorted dates
  const sortedGroups = {}
  sortedDates.forEach(date => {
    sortedGroups[date] = groups[date]
  })
  
  return sortedGroups
})

// Today's events count
const todayEventsCount = computed(() => {
  const today = new Date()
  const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
  
  return filteredEvents.value.filter(event => {
    const eventDate = event.date.split(' ')[0]
    return eventDate === todayStr
  }).length
})

// Pagination
const totalPages = computed(() => 
  Math.ceil(filteredNews.value.length / itemsPerPage.value)
)

const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredNews.value.slice(start, end)
})

// Stats
const totalNews = computed(() => allNews.value.length)
const highImpactEvents = computed(() => 
  filteredEvents.value.filter(e => e.impact === 'High').length
)

const hasActiveFilters = computed(() => {
  return filters.category || 
         filters.market || 
         filters.impact || 
         filters.country ||
         filters.keyword || 
         filters.source
})

// Helper functions
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatEventDate = (dateStr) => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Parse DD-MM-YYYY format
  const [day, month, year] = dateStr.split('-').map(Number)
  const eventDate = new Date(year, month - 1, day)
  
  if (eventDate.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (eventDate.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }
  
  return eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatEventTime = (dateTime) => {
  if (!dateTime) return 'All Day'
  const [, time] = dateTime.split(' ')
  if (!time) return 'All Day'
  
  // Convert 24h to 12h format
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

const truncateDescription = (html, maxLength = 150) => {
  if (!html) return ''
  const text = html.replace(/<[^>]*>/g, '')
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const getImpactClass = (impact) => {
  return impact?.toLowerCase() || ''
}

const getEventImpactClass = (impact) => {
  if (!impact) return ''
  return impact.toLowerCase()
}

const getSourceClass = (source) => {
  return source?.toLowerCase().replace(/\s+/g, '-') || ''
}

// Debounce function
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Apply filters and reset page
const applyFilters = () => {
  currentPage.value = 1
}

const debouncedApplyFilters = debounce(applyFilters, 500)

const clearKeyword = () => {
  filters.keyword = ''
  applyFilters()
}

const resetFilters = () => {
  filters.category = ''
  filters.market = ''
  filters.impact = ''
  filters.country = ''
  filters.keyword = ''
  filters.source = ''
  applyFilters()
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

// Fetch news
const fetchNews = async (forceRefresh = false) => {
  // Try to load from cache first (NO API CALL)
  if (!forceRefresh) {
    const loaded = loadNewsFromCache()
    if (loaded) {
      return
    }
  }
  
  loading.value = true
  error.value = null
  
  try {
    const token = getAuthToken()
    
    const params = new URLSearchParams()
    if (filters.category) params.append('category', filters.category)
    if (filters.market) params.append('market', filters.market)
    if (filters.impact) params.append('impact', filters.impact)
    if (filters.keyword) params.append('keyword', filters.keyword)
    
    const url = `${API_BASE_URL}/insight${params.toString() ? '?' + params.toString() : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      allNews.value = data.data || []
      saveNewsToCache(allNews.value)
      notification.success(`Loaded ${allNews.value.length} news articles`)
    } else {
      throw new Error(data.message || 'Failed to fetch news')
    }
  } catch (err) {
    error.value = err.message
    notification.error(err.message)
  } finally {
    loading.value = false
  }
}

// Fetch Forex Factory events
const fetchEvents = async (forceRefresh = false) => {
  // Try to load from cache first (NO API CALL)
  if (!forceRefresh) {
    const loaded = loadEventsFromCache()
    if (loaded) {
      return
    }
  }
  
  eventsLoading.value = true
  eventsError.value = null
  
  try {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/insight/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      events.value = data.data || []
      saveEventsToCache(events.value)
      notification.success(`Loaded ${events.value.length} economic events`)
    } else {
      throw new Error(data.message || 'Failed to fetch events')
    }
  } catch (err) {
    eventsError.value = err.message
    notification.error(err.message)
  } finally {
    eventsLoading.value = false
  }
}

// Watch for filter changes
watch([() => filters.category, () => filters.market, () => filters.impact, () => filters.country, () => filters.source], () => {
  applyFilters()
})
</script>
<style scoped>
.insight-page {
  padding: clamp(12px, 2.25vw, 18px);
  max-width: 1600px;
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

.content-wrapper {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 18px;
}

@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 220px 1fr;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
}

/* Filters Sidebar */
.filters-sidebar {
  background: white;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 18px;
}

.dark .filters-sidebar {
  background: #1f2937;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filters-header h3 {
  margin: 0;
  font-size: 13.5px;
  color: #1f2937;
}

.dark .filters-header h3 {
  color: white;
}

.reset-filters-btn {
  padding: 3px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  background: white;
  color: #6b7280;
  font-size: 9px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-filters-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.dark .reset-filters-btn {
  background: #374151;
  border-color: #4b5563;
  color: #9ca3af;
}

.dark .reset-filters-btn:hover {
  background: #4b5563;
  color: white;
}

.filter-group {
  margin-bottom: 15px;
}

.filter-label {
  display: block;
  margin-bottom: 6px;
  font-size: 10.5px;
  font-weight: 500;
  color: #374151;
}

.dark .filter-label {
  color: #e5e7eb;
}

.filter-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 10.5px;
  background: white;
  color: #1f2937;
  cursor: pointer;
}

.dark .filter-select {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.impact-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.impact-option {
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  font-size: 10.5px;
}

.impact-option input[type="radio"] {
  margin: 0;
  cursor: pointer;
}

.impact-high {
  color: #ef4444;
  font-weight: 500;
}

.impact-medium {
  color: #f59e0b;
  font-weight: 500;
}

.impact-low {
  color: #10b981;
  font-weight: 500;
}

.impact-holiday {
  color: #8b5cf6;
  font-weight: 500;
}

.keyword-search {
  position: relative;
  display: flex;
  align-items: center;
}

.keyword-input {
  width: 100%;
  padding: 6px 25px 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 10.5px;
  background: white;
  color: #1f2937;
}

.dark .keyword-input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.clear-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 2px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  color: #ef4444;
}

.active-filters {
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.dark .active-filters {
  border-top-color: #374151;
}

.active-filters-title {
  font-size: 9px;
  color: #6b7280;
  margin-bottom: 6px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  background: #f3f4f6;
  border-radius: 3px;
  font-size: 8px;
  color: #374151;
}

.dark .filter-tag {
  background: #374151;
  color: #e5e7eb;
}

.filter-tag button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  font-size: 8px;
  display: flex;
  align-items: center;
}

.filter-tag button:hover {
  color: #ef4444;
}

/* Main Content */
.main-content {
  background: white;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark .main-content {
  background: #1f2937;
}

.stats-bar {
  display: flex;
  gap: 20px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.dark .stats-bar {
  border-bottom-color: #374151;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 8px;
  color: #6b7280;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.dark .stat-value {
  color: white;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.dark .tab-navigation {
  border-bottom-color: #374151;
}

.tab-btn {
  padding: 6px 12px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
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

/* News Feed */
.news-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.news-card {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.news-card:hover {
  transform: translateX(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.news-card.high {
  border-left-color: #ef4444;
}

.news-card.medium {
  border-left-color: #f59e0b;
}

.news-card.low {
  border-left-color: #10b981;
}

.dark .news-card {
  background: #374151;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 6px;
}

.news-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.news-source {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 500;
  background: #e5e7eb;
  color: #374151;
}

.news-source.bbc {
  background: #b91c1c;
  color: white;
}

.news-source.aljazeera {
  background: #0f4e3a;
  color: white;
}

.news-source.theguardian {
  background: #052962;
  color: white;
}

.news-category {
  padding: 2px 6px;
  background: #e5e7eb;
  border-radius: 3px;
  font-size: 8px;
  color: #374151;
}

.news-impact {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 500;
}

.news-impact.high {
  background: #fee2e2;
  color: #991b1b;
}

.news-impact.medium {
  background: #fef3c7;
  color: #92400e;
}

.news-impact.low {
  background: #d1fae5;
  color: #065f46;
}

.dark .news-impact.high {
  background: #7f1d1d;
  color: #fecaca;
}

.dark .news-impact.medium {
  background: #78350f;
  color: #fcd34d;
}

.dark .news-impact.low {
  background: #064e3b;
  color: #a7f3d0;
}

.news-time {
  font-size: 8px;
  color: #6b7280;
  white-space: nowrap;
}

.news-title {
  margin: 0 0 6px 0;
  font-size: 12px;
  line-height: 1.4;
}

.news-title a {
  color: #1f2937;
  text-decoration: none;
  transition: color 0.2s;
}

.news-title a:hover {
  color: #3b82f6;
}

.dark .news-title a {
  color: white;
}

.dark .news-title a:hover {
  color: #60a5fa;
}

.news-description {
  margin: 0 0 8px 0;
  font-size: 9.75px;
  line-height: 1.5;
  color: #4b5563;
}

.dark .news-description {
  color: #9ca3af;
}

.news-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.market-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.market-tag {
  padding: 2px 6px;
  background: #e0f2fe;
  border-radius: 3px;
  font-size: 7.5px;
  color: #0369a1;
}

.dark .market-tag {
  background: #0c4a6e;
  color: #7dd3fc;
}

.no-tags {
  font-size: 7.5px;
  color: #9ca3af;
  font-style: italic;
}

.read-more {
  font-size: 8px;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
}

.read-more:hover {
  text-decoration: underline;
}

/* Events Feed */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-date-group {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.dark .event-date-group {
  border-color: #374151;
}

.event-date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.dark .event-date-header {
  background: #2d3748;
  border-bottom-color: #4a5568;
}

.event-date-header h4 {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: #1f2937;
}

.dark .event-date-header h4 {
  color: white;
}

.event-count {
  font-size: 8px;
  color: #6b7280;
  background: white;
  padding: 2px 6px;
  border-radius: 10px;
}

.dark .event-count {
  background: #4a5568;
  color: #e5e7eb;
}

.event-card {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.2s;
}

.event-card:last-child {
  border-bottom: none;
}

.event-card:hover {
  background: #f9fafb;
}

.event-card.high {
  border-left: 3px solid #ef4444;
}

.event-card.medium {
  border-left: 3px solid #f59e0b;
}

.event-card.low {
  border-left: 3px solid #10b981;
}

.event-card.holiday {
  border-left: 3px solid #8b5cf6;
}

.dark .event-card {
  border-bottom-color: #374151;
}

.dark .event-card:hover {
  background: #2d3748;
}

.event-time {
  width: 100px;
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  padding-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-countdown {
  font-size: 8px;
  font-weight: 600;
  color: #3b82f6;
  background: #dbeafe;
  padding: 2px 4px;
  border-radius: 3px;
  display: inline-block;
  width: fit-content;
}

.dark .event-countdown {
  background: #1e3a8a;
  color: #93c5fd;
}

.event-content {
  flex: 1;
}

.event-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.event-country {
  padding: 2px 8px;
  background: #e5e7eb;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  color: #374151;
}

.dark .event-country {
  background: #4a5568;
  color: #e5e7eb;
}

.event-impact {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 500;
}

.event-impact.high {
  background: #fee2e2;
  color: #991b1b;
}

.event-impact.medium {
  background: #fef3c7;
  color: #92400e;
}

.event-impact.low {
  background: #d1fae5;
  color: #065f46;
}

.event-impact.holiday {
  background: #ede9fe;
  color: #6d28d9;
}

.dark .event-impact.high {
  background: #7f1d1d;
  color: #fecaca;
}

.dark .event-impact.medium {
  background: #78350f;
  color: #fcd34d;
}

.dark .event-impact.low {
  background: #064e3b;
  color: #a7f3d0;
}

.dark .event-impact.holiday {
  background: #4c1d95;
  color: #ddd6fe;
}

.event-title {
  margin: 0 0 8px 0;
  font-size: 11px;
  font-weight: 500;
  color: #1f2937;
}

.dark .event-title {
  color: white;
}

.event-details {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.event-detail {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 7px;
  color: #6b7280;
  margin-bottom: 2px;
}

.detail-value {
  font-size: 9px;
  font-weight: 500;
  color: #374151;
}

.dark .detail-value {
  color: #e5e7eb;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 15px;
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

.dark .pagination-btn:hover:not(:disabled) {
  background: #4b5563;
}

.page-info {
  font-size: 9px;
  color: #6b7280;
}

/* Loading state */
.loading-state {
  text-align: center;
  padding: 30px;
  color: #6b7280;
}

.spinner {
  width: 30px;
  height: 30px;
  margin: 0 auto 12px;
  border: 2px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error state */
.error-state {
  text-align: center;
  padding: 30px;
}

.error-message {
  color: #ef4444;
  margin-bottom: 10px;
  font-size: 11px;
}

.btn-retry {
  padding: 5px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 9px;
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
  font-size: 11px;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-sidebar {
    position: static;
    margin-bottom: 12px;
  }
  
  .news-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .news-meta {
    width: 100%;
  }
  
  .news-time {
    align-self: flex-end;
  }
  
  .event-card {
    flex-direction: column;
  }
  
  .event-time {
    width: auto;
    margin-bottom: 4px;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  
  .event-details {
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .stats-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .stat-item {
    min-width: calc(50% - 6px);
  }
  
  .news-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .read-more {
    align-self: flex-end;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
  
  .tab-navigation {
    flex-direction: column;
  }
  
  .tab-btn {
    width: 100%;
    text-align: center;
  }
  
  .event-time {
    flex-wrap: wrap;
  }
}

/* Touch improvements */
@media (hover: none) and (pointer: coarse) {
  .filter-select,
  .keyword-input,
  .pagination-btn,
  .btn-retry,
  .tab-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .filter-tag {
    padding: 5px 8px;
  }
  
  .filter-tag button {
    padding: 2px 6px;
  }
  
  .event-card {
    padding: 15px;
  }
}
</style>