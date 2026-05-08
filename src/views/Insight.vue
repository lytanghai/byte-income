<template>
  <div class="insight-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Market Insights</h1>
        <p class="subtitle">Real-time news and economic events</p>
      </div>
      <button class="daily-analysis-btn" @click="openDailyAnalysis">
        📊 Daily Analysis
      </button>
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
          <select v-model="filters.category" class="filter-select">
            <option value="">Any Category</option>
            <option value="war">War</option>
            <option value="crime">Crime</option>
            <option value="fomc">FOMC</option>
            <option value="gold">Gold</option>
            <option value="oil">Oil</option>
            <option value="financial">Financial</option>
            <option value="economy">Economy</option>
            <option value="markets">Markets</option>
            <option value="tech">Technology</option>
            <option value="crypto">Cryptocurrency</option>
          </select>
        </div>

        <!-- Last Updated Filter -->
        <div class="filter-group">
          <label class="filter-label">Last Updated</label>
          <select v-model="filters.last_updated" class="filter-select">
            <option value="">Any Time</option>
            <option value="1h">Last hour</option>
            <option value="2h">Last 2 hours</option>
            <option value="4h">Last 4 hours</option>
            <option value="12h">Last 12 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
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

        <!-- Keyword Search -->
        <div class="filter-group">
          <label class="filter-label">Keyword</label>
          <div class="keyword-search">
            <input type="text" v-model="filters.keyword" @keyup.enter="handleSearch" placeholder="Search in title..."
              class="keyword-input" />
            <button v-if="filters.keyword" @click="clearKeyword" class="clear-btn">✕</button>
          </div>
        </div>

        <!-- Trending Keywords -->
        <div class="trending-keywords" v-if="trendingKeywords.length > 0">
          <div class="trending-title">
            🔥 Trending Keywords
          </div>
          <div class="keyword-tags">
            <span v-for="(item, index) in trendingKeywords" :key="index" class="keyword-tag"
              @click="selectKeyword(item[0])">
              {{ item[0] }} ({{ item[1] }})
            </span>
          </div>
        </div>

        <!-- Search Button -->
        <div class="filter-group">
          <button @click="handleSearch" class="btn-search"
            :disabled="(!filters.category && !filters.keyword) || newsLoading">
            <span v-if="newsLoading" class="spinner-small"></span>
            {{ newsLoading ? 'Searching...' : 'Apply' }}
          </button> <br>
          <small v-if="!filters.category && !filters.keyword" class="error-hint">
            Enter a category or keyword to search
          </small>
        </div>

        <!-- Active Filters -->
        <div v-if="hasActiveFilters" class="active-filters">
          <div class="active-filters-title">Active Filters:</div>
          <div class="filter-tags">
            <span v-if="filters.category" class="filter-tag">
              Category: {{ filters.category }}
              <button @click="filters.category = ''">✕</button>
            </span>
            <span v-if="filters.last_updated" class="filter-tag">
              Last {{ filters.last_updated }}
              <button @click="filters.last_updated = ''">✕</button>
            </span>
            <span v-if="filters.source" class="filter-tag">
              Source: {{ filters.source }}
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
          <button class="tab-btn" :class="{ active: activeTab === 'news' }" @click="activeTab = 'news'">
            News Feed
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'events' }" @click="activeTab = 'events'">
            Forex Factory Calendar
          </button>
        </div>

        <!-- News Feed Tab -->
        <div v-show="activeTab === 'news'" class="news-feed">
          <!-- Initial State - No Search Yet -->
          <div v-if="!hasSearched" class="initial-state">
            <h3>🔍 Search for News</h3>
            <p>Enter a category or keyword to find relevant news articles</p>
            <div class="search-hint"> <br>
              <span class="hint-item">• Select a category OR enter a keyword</span> <br>
              <span class="hint-item">• You can add time filters for better results</span>
            </div>
          </div>

          <!-- Loading State -->
          <div v-else-if="newsLoading && allNews.length === 0" class="loading-state">
            <div class="spinner"></div>
            <p>Searching news...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <p class="error-message">{{ error }}</p>
            <button @click="handleSearch" class="btn-retry">Retry</button>
          </div>

          <!-- News List -->
          <div v-else-if="allNews.length > 0" class="news-list">
            <div v-if="filteredNews.length === 0" class="no-data">
              No news articles match your filters
            </div>

            <div v-for="(item, index) in paginatedNews" :key="index" class="news-card">
              <div class="news-header">
                <div class="news-meta">
                  <span class="news-source">{{ item.source }}</span>
                </div>
              </div>
              <h3 class="news-title">
                <a :href="item.link" target="_blank" rel="noopener noreferrer">
                  {{ item.title }}
                </a>
              </h3>
            </div>

            <!-- Pagination -->
            <div class="pagination">
              <button @click="currentPage--" :disabled="currentPage === 1" class="pagination-btn">
                ← Previous
              </button>
              <span class="page-info">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button @click="currentPage++" :disabled="currentPage === totalPages" class="pagination-btn">
                Next →
              </button>
            </div>
          </div>

          <!-- No Results State -->
          <div v-else-if="hasSearched && allNews.length === 0" class="no-results">
            <div class="no-results-icon">📭</div>
            <h3>No News Found</h3>
            <p>Try adjusting your filters or search for a different term</p>
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

            <div v-for="(group, date) in sortedEventGroupsAsc" :key="date" class="event-date-group">
              <div class="event-date-header">
                <h4>{{ formatEventDate(date) }}</h4>
                <span class="event-count">{{ group.length }} events</span>
              </div>

              <div v-for="event in group" :key="event.date + event.title" class="event-card"
                :class="getEventImpactClass(event.impact)">
                <div class="event-time">
                  {{ formatEventTime(event.date) }}
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

    <!-- Daily Analysis Modal -->
    <div v-if="showAnalysisModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>📊 Daily Market Analysis</h2>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        
        <div v-if="analysisLoading" class="modal-loading">
          <div class="spinner"></div>
          <p>Loading analysis...</p>
        </div>
        
        <div v-else-if="analysisError" class="modal-error">
          <p>{{ analysisError }}</p>
          <button @click="fetchDailyAnalysis" class="btn-retry">Retry</button>
        </div>
        
        <div v-else-if="analysisData" class="modal-body">
          <!-- Date -->
          <div class="analysis-date">
            📅 {{ formatAnalysisDate(analysisData.date) }}
          </div>
          
          <!-- Trend Badge -->
          <div class="trend-badge" :class="getTrendClass(analysisData.trend)">
            {{ analysisData.trend }}
          </div>
          
          <!-- Price Info -->
          <div class="price-info">
            <div class="price-card">
              <div class="price-label">Current Price</div>
              <div class="price-value">${{ formatNumber(analysisData.current_price) }}</div>
            </div>
            <div class="price-card">
              <div class="price-label">Opening Price</div>
              <div class="price-value">${{ formatNumber(analysisData.opening_price) }}</div>
            </div>
          </div>
          
          <!-- Gap Info -->
          <div class="gap-info" :class="getGapClass(analysisData.gap)">
            <div class="gap-label">Price Gap</div>
            <div class="gap-value">
              {{ analysisData.gap > 0 ? '+' : '' }}{{ formatNumber(analysisData.gap) }}
              <span class="gap-percent">({{ calculateGapPercent(analysisData.gap, analysisData.opening_price) }})</span>
            </div>
          </div>
          
          <!-- Movement Analysis -->
          <div class="movement-analysis">
            <div class="movement-title">📈 Movement Analysis</div>
            <div class="movement-details">
              <div class="movement-item">
                <span>Change:</span>
                <strong :class="getChangeClass(analysisData.gap)">
                  {{ analysisData.gap > 0 ? '+' : '' }}${{ formatNumber(analysisData.gap) }}
                </strong>
              </div>
              <div class="movement-item">
                <span>Percentage:</span>
                <strong :class="getChangeClass(analysisData.gap)">
                  {{ calculateGapPercent(analysisData.gap, analysisData.opening_price) }}
                </strong>
              </div>
            </div>
          </div>
          
          <!-- Analysis Result -->
          <div class="analysis-result">
            <div class="result-title">💡 Analysis Result</div>
            <div class="result-text">{{ analysisData.result }}</div>
          </div>
          
          <!-- Recommendations -->
          <div class="recommendations">
            <div class="rec-title">🎯 Recommendations</div>
            <div class="rec-list">
              <div v-if="analysisData.trend === 'STRONG BULLISH'" class="rec-item bullish">
                <span class="rec-icon">📈</span>
                <span>Consider long positions with tight stop losses</span>
              </div>
              <div v-else-if="analysisData.trend === 'BULLISH'" class="rec-item bullish">
                <span class="rec-icon">📈</span>
                <span>Look for buying opportunities on pullbacks</span>
              </div>
              <div v-else-if="analysisData.trend === 'STRONG BEARISH'" class="rec-item bearish">
                <span class="rec-icon">📉</span>
                <span>Consider short positions or stay in cash</span>
              </div>
              <div v-else-if="analysisData.trend === 'BEARISH'" class="rec-item bearish">
                <span class="rec-icon">📉</span>
                <span>Look for selling opportunities on rallies</span>
              </div>
              <div v-else class="rec-item neutral">
                <span class="rec-icon">⚖️</span>
                <span>Wait for clearer direction before trading</span>
              </div>
              
              <div v-if="Math.abs(analysisData.gap) > 50" class="rec-item warning">
                <span class="rec-icon">⚠️</span>
                <span>Large gap detected - be cautious of volatility</span>
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
  setCache(cacheName, data, 5)
}
const notification = useNotification()

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API_TRENDING_URL = import.meta.env.VITE_API_TRENDING_BASE_URL

// Cache keys
const NEWS_CACHE_KEY = 'insight_news_cache'
const NEWS_TIMESTAMP_KEY = 'insight_news_timestamp'
const EVENTS_CACHE_KEY = 'insight_events_cache'
const EVENTS_TIMESTAMP_KEY = 'insight_events_timestamp'

// State
const allNews = ref([])
const events = ref([])
const newsLoading = ref(false)
const eventsLoading = ref(false)
const error = ref(null)
const eventsError = ref(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const activeTab = ref('news')
const currentTime = ref(new Date())
const hasSearched = ref(false)
let timerInterval = null

// Daily Analysis State
const showAnalysisModal = ref(false)
const analysisData = ref(null)
const analysisLoading = ref(false)
const analysisError = ref(null)

// Trending keywords
const trendingKeywords = ref([])
const keywordLoading = ref(false)

// Filters
const filters = reactive({
  category: '',
  last_updated: '',
  source: '',
  keyword: ''
})

// Available sources
const sources = computed(() => {
  const srcs = new Set(allNews.value.map(item => item.source).filter(Boolean))
  return Array.from(srcs).sort()
})

// ============== DAILY ANALYSIS ==============
const openDailyAnalysis = () => {
  showAnalysisModal.value = true
  fetchDailyAnalysis()
}

const closeModal = () => {
  showAnalysisModal.value = false
  analysisData.value = null
  analysisError.value = null
}

const getAuthToken = () => {
  const authToken = localStorage.getItem('authToken')
  if (!authToken) {
    notification.error('No authentication token found')
    throw new Error('No authentication token found')
  }
  return authToken
}

const fetchDailyAnalysis = async () => {
  analysisLoading.value = true
  analysisError.value = null

  try {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/insight/daily-analysis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (data.code === '200') {
      analysisData.value = data.data
      notification.success('Daily analysis loaded')
    } else {
      throw new Error(data.message || 'Failed to fetch daily analysis')
    }
  } catch (err) {
    analysisError.value = err.message
    notification.error(err.message)
  } finally {
    analysisLoading.value = false
  }
}

const formatAnalysisDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatNumber = (value) => {
  if (!value && value !== 0) return '0'
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const calculateGapPercent = (gap, openingPrice) => {
  if (!openingPrice || openingPrice === 0) return '0%'
  const percent = (gap / openingPrice) * 100
  return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`
}

const getTrendClass = (trend) => {
  if (!trend) return ''
  return trend.toLowerCase().replace(' ', '-')
}

const getGapClass = (gap) => {
  if (gap > 0) return 'positive'
  if (gap < 0) return 'negative'
  return 'neutral'
}

const getChangeClass = (gap) => {
  if (gap > 0) return 'positive'
  if (gap < 0) return 'negative'
  return 'neutral'
}

// ============== CACHE MANAGEMENT ==============
const saveNewsToCache = (data) => {
  try {
    const cacheData = {
      data: data,
      filters: {
        category: filters.category,
        last_updated: filters.last_updated,
        source: filters.source,
        keyword: filters.keyword
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

      if (cacheData.filters.category === filters.category &&
        cacheData.filters.last_updated === filters.last_updated &&
        cacheData.filters.source === filters.source &&
        cacheData.filters.keyword === filters.keyword) {

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
        keyword: filters.keyword
      }
    }
    saveCacheData(EVENTS_CACHE_KEY, JSON.stringify(cacheData), 1440)
    saveCacheData(EVENTS_TIMESTAMP_KEY, new Date().toISOString(), 30)
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

      if (cacheData.filters.keyword === filters.keyword) {
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
  fetchEvents()
  fetchTrendingKeywords()
  startTimer()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

// Filtered news
const filteredNews = computed(() => {
  return allNews.value.filter(item => {
    if (filters.source && item.source !== filters.source) return false
    if (filters.keyword && filters.category) {
      const keyword = filters.keyword.toLowerCase()
      const titleMatch = item.title?.toLowerCase().includes(keyword)
      if (!titleMatch) return false
    }
    return true
  })
})

// Filtered events
const filteredEvents = computed(() => {
  return events.value.filter(event => {
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const titleMatch = event.title?.toLowerCase().includes(keyword)
      if (!titleMatch) return false
    }
    return true
  })
})

// Parse date string
const parseEventDate = (dateStr) => {
  if (!dateStr) return new Date(0)
  const [datePart, timePart] = dateStr.split(' ')
  const [day, month, year] = datePart.split('-').map(Number)
  const [hours, minutes, seconds] = timePart ? timePart.split(':').map(Number) : [0, 0, 0]
  return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0)
}

const isToday = (dateStr) => {
  const today = new Date()
  const [day, month, year] = dateStr.split('-').map(Number)
  return day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear()
}

const getCountdown = (dateTime) => {
  if (!dateTime) return ''
  const eventDate = parseEventDate(dateTime)
  const now = currentTime.value
  if (eventDate < now) return 'Ended'
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

// Group and sort events
const sortedEventGroupsAsc = computed(() => {
  const groups = {}
  filteredEvents.value.forEach(event => {
    const date = event.date.split(' ')[0]
    if (!groups[date]) groups[date] = []
    groups[date].push(event)
  })
  Object.keys(groups).forEach(date => {
    groups[date].sort((a, b) => {
      const timeA = a.date.split(' ')[1] || ''
      const timeB = b.date.split(' ')[1] || ''
      return timeA.localeCompare(timeB)
    })
  })
  const now = currentTime.value
  const upcomingDates = []
  const pastDates = []
  Object.keys(groups).forEach(date => {
    const lastEventTime = parseEventDate(date + ' 23:59:59')
    if (lastEventTime < now) {
      pastDates.push(date)
    } else {
      upcomingDates.push(date)
    }
  })
  upcomingDates.sort((a, b) => {
    const dateA = parseEventDate(a + ' 00:00:00')
    const dateB = parseEventDate(b + ' 00:00:00')
    return dateA - dateB
  })
  pastDates.sort((a, b) => {
    const dateA = parseEventDate(a + ' 00:00:00')
    const dateB = parseEventDate(b + ' 00:00:00')
    return dateB - dateA
  })
  const sortedDates = [...upcomingDates, ...pastDates]
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
const totalPages = computed(() => Math.ceil(filteredNews.value.length / itemsPerPage.value))
const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredNews.value.slice(start, end)
})

// Stats
const totalNews = computed(() => allNews.value.length)
const highImpactEvents = computed(() => filteredEvents.value.filter(e => e.impact === 'High').length)
const hasActiveFilters = computed(() => {
  return filters.category || filters.last_updated || filters.source || filters.keyword
})

// Search functions
const handleSearch = async () => {
  if (!filters.category && !filters.keyword) {
    notification.error('Please select a category or enter a keyword')
    return
  }
  hasSearched.value = true
  currentPage.value = 1
  const loaded = loadNewsFromCache()
  if (loaded) return
  await fetchNews(true)
}

const formatEventDate = (dateStr) => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const [day, month, year] = dateStr.split('-').map(Number)
  const eventDate = new Date(year, month - 1, day)
  if (eventDate.toDateString() === today.toDateString()) return 'Today'
  if (eventDate.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
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
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

const getEventImpactClass = (impact) => {
  if (!impact) return ''
  return impact.toLowerCase()
}

const applyFilters = () => {
  currentPage.value = 1
}

const clearKeyword = () => {
  filters.keyword = ''
  applyFilters()
}

const resetFilters = () => {
  filters.category = ''
  filters.last_updated = ''
  filters.source = ''
  filters.keyword = ''
  hasSearched.value = false
  allNews.value = []
  applyFilters()
}

const fetchTrendingKeywords = async () => {
  keywordLoading.value = true
  try {
    const response = await fetch(`${API_TRENDING_URL}/trends`)
    const data = await response.json()
    trendingKeywords.value = data.top_keywords || []
  } catch (err) {
    console.error("Failed to fetch keywords:", err)
  } finally {
    keywordLoading.value = false
  }
}

const selectKeyword = (keyword) => {
  filters.keyword = keyword
  applyFilters()
}

const fetchNews = async (forceRefresh = false) => {
  newsLoading.value = true
  error.value = null
  try {
    const token = getAuthToken()
    const searchCategory = filters.category || filters.keyword
    const payload = { category: searchCategory }
    if (filters.last_updated) payload.last_updated = filters.last_updated
    console.log('🔍 Searching news with payload:', payload)
    const response = await fetch(`${API_BASE_URL}/insight/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    if (data.code === '200') {
      allNews.value = data.data.data || []
      saveNewsToCache(allNews.value)
      notification.success(`Found ${allNews.value.length} news articles for: ${searchCategory}`)
    } else {
      throw new Error(data.message || 'Failed to fetch news')
    }
  } catch (err) {
    error.value = err.message
    notification.error(err.message)
  } finally {
    newsLoading.value = false
  }
}

const fetchEvents = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const loaded = loadEventsFromCache()
    if (loaded) return
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

watch([() => filters.source, () => filters.keyword], () => {
  applyFilters()
})
</script>

<style scoped>
    @import '../assets/styles/insight.css';
</style>