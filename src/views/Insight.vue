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

        <!-- Category Filter (Optional) -->
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
          <!-- <small class="hint">Leave empty to search by keyword only</small> -->
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
          <!-- <small class="hint">If no category selected, keyword will be used as search term</small> -->
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
              <!-- Card Header -->
              <div class="news-header">
                <div class="news-meta">
                  <span class="news-source">{{ item.source }}</span>
                </div>
              </div>

              <!-- Card Title -->
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

            <!-- Date Group - Sorted Ascending (Tomorrow first, then next days) -->
            <div v-for="(group, date) in sortedEventGroupsAsc" :key="date" class="event-date-group">
              <div class="event-date-header">
                <h4>{{ formatEventDate(date) }}</h4>
                <span class="event-count">{{ group.length }} events</span>
              </div>

              <div v-for="event in group" :key="event.date + event.title" class="event-card"
                :class="getEventImpactClass(event.impact)">
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
const API_TRENDING_URL = import.meta.env.VITE_API_TRENDING_BASE_URL

// Cache keys for localStorage
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

//Keyword for news search
const trendingKeywords = ref([])
const keywordLoading = ref(false)

// Filters
const filters = reactive({
  category: '',
  last_updated: '',
  source: '',
  keyword: ''
})

// Available sources (computed from data)
const sources = computed(() => {
  const srcs = new Set(allNews.value.map(item => item.source).filter(Boolean))
  return Array.from(srcs).sort()
})

// ============== VALIDATION ==============

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

      // Check if filters match
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

      // Check if filters match
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

// Filtered news (client-side filtering)
const filteredNews = computed(() => {
  return allNews.value.filter(item => {
    // Source filter
    if (filters.source && item.source !== filters.source) return false

    // Keyword search (if keyword exists and we're not using it as category)
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
    return 'Ended'
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

// Group and sort events by date (upcoming first, past last)
const sortedEventGroupsAsc = computed(() => {
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

  const now = currentTime.value

  // Separate upcoming and past dates
  const upcomingDates = []
  const pastDates = []

  Object.keys(groups).forEach(date => {
    const eventDate = parseEventDate(date + ' 00:00:00')
    const lastEventTime = parseEventDate(date + ' 23:59:59')

    if (lastEventTime < now) {
      // All events on this date are in the past
      pastDates.push(date)
    } else {
      // This date has upcoming events
      upcomingDates.push(date)
    }
  })

  // Sort upcoming dates in ascending order (soonest first)
  upcomingDates.sort((a, b) => {
    const dateA = parseEventDate(a + ' 00:00:00')
    const dateB = parseEventDate(b + ' 00:00:00')
    return dateA - dateB
  })

  // Sort past dates in descending order (most recent past first)
  pastDates.sort((a, b) => {
    const dateA = parseEventDate(a + ' 00:00:00')
    const dateB = parseEventDate(b + ' 00:00:00')
    return dateB - dateA
  })

  // Combine: upcoming first, then past
  const sortedDates = [...upcomingDates, ...pastDates]

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
    filters.last_updated ||
    filters.source ||
    filters.keyword
})

// ============== SEARCH FUNCTION ==============
const handleSearch = async () => {
  // Validate that either category or keyword is provided
  if (!filters.category && !filters.keyword) {
    notification.error('Please select a category or enter a keyword')
    return
  }

  hasSearched.value = true
  currentPage.value = 1

  // Try to load from cache first
  const loaded = loadNewsFromCache()
  if (loaded) {
    return
  }

  // If not in cache, fetch from API
  await fetchNews(true)
}

// Helper functions
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

const getEventImpactClass = (impact) => {
  if (!impact) return ''
  return impact.toLowerCase()
}

// Apply filters and reset page
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

// Get auth token
const getAuthToken = () => {
  const authToken = localStorage.getItem('authToken')
  if (!authToken) {
    notification.error('No authentication token found')
    throw new Error('No authentication token found')
  }
  return authToken
}

const fetchTrendingKeywords = async () => {
  keywordLoading.value = true

  try {
    const response = await fetch(`${API_TRENDING_URL}/trends`)
    const data = await response.json()

    // API format:
    // { top_keywords: [["iran",10],["oil",6],...] }

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

// Fetch news using new API
const fetchNews = async (forceRefresh = false) => {
  newsLoading.value = true
  error.value = null

  try {
    const token = getAuthToken()

    // Determine what to use as category
    // If category is selected, use that
    // Otherwise, use the keyword as the category
    const searchCategory = filters.category || filters.keyword

    const payload = {
      category: searchCategory
    }

    if (filters.last_updated) {
      payload.last_updated = filters.last_updated
    }

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

// Watch for filter changes (only for UI updates, not API calls)
watch([() => filters.source, () => filters.keyword], () => {
  applyFilters()
})
</script>

<style scoped>
@import '../assets/styles/insight.css';
</style>