<!-- <template>
  <div class="polymarket-container">
    <!-- Header Section -->
    <div class="header">
      <h1>
        <i class="fas fa-chart-line" style="margin-right: 10px; color: #3b82f6;"></i> 
        Polymarket Events & Polls
      </h1>
      <p>Explore real-time prediction markets, events, and question polls from Polymarket Gamma API</p>
      <div class="badge">
        <i class="fas fa-database"></i> Live from Polymarket Gamma API
      </div>
    </div>

    <!-- Controls Section -->
    <div class="controls">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Filter by event title, question, or category..."
        />
      </div>
      <div class="limit-control">
        <label>Events per page:</label>
        <select v-model="limit" class="limit-select" @change="refreshEvents">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
      <div class="category-filter">
        <select v-model="selectedCategory" class="category-select">
          <option value="all">All Categories</option>
          <option v-for="cat in uniqueCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="status-filter">
        <button 
          v-for="filter in statusFilters" 
          :key="filter.value"
          class="filter-btn"
          :class="{ active: activeStatusFilter === filter.value }"
          @click="activeStatusFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
      <button class="refresh-btn" @click="refreshEvents" :disabled="loading">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        Refresh
      </button>
    </div>

    <!-- Stats Section -->
    <div class="stats" v-if="!loading && filteredEvents.length > 0">
      <span><i class="fas fa-chart-simple"></i> Showing {{ filteredEvents.length }} of {{ events.length }} events</span>
      <span><i class="fas fa-clock"></i> Last update: {{ lastUpdated || '—' }}</span>
      <span><i class="fas fa-chart-line"></i> Total Volume: {{ formatMoney(totalVolume) }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-pulse fa-2x" style="color:#3b82f6"></i>
      <p style="margin-top: 1rem;">Loading events from Polymarket Gamma API...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-circle-exclamation fa-2x" style="color:#ef4444"></i>
      <p style="margin-top: 0.5rem; font-weight: 500;">{{ error }}</p>
      <button @click="refreshEvents" class="retry-btn">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredEvents.length === 0" class="empty-state">
      <i class="fas fa-poll fa-2x" style="color:#94a3b8"></i>
      <p>No events match your filters or search.</p>
      <p style="font-size: 0.8rem;">Try adjusting keywords or category.</p>
    </div>

    <!-- Events Grid -->
    <div class="events-grid" v-else>
      <div v-for="event in filteredEvents" :key="event.id" class="event-card">
        <!-- Event Header -->
        <div class="event-header">
          <div class="event-category" v-if="event.category">
            <i class="fas fa-tag"></i> {{ event.category }}
          </div>
          <div class="event-title">{{ event.title || event.ticker || 'Untitled Event' }}</div>
          <div class="event-description" v-if="event.description">
            {{ truncate(event.description, 120) }}
          </div>
          <div class="event-meta">
            <span class="status" :class="getEventStatusClass(event)">
              {{ getEventStatus(event) }}
            </span>
            <span v-if="event.startDate">
              <i class="far fa-calendar-alt"></i> 
              Starts: {{ formatDate(event.startDate) }}
            </span>
            <span v-if="event.endDate">
              <i class="far fa-calendar-check"></i> 
              Ends: {{ formatDate(event.endDate) }}
            </span>
            <span v-if="event.volume">
              <i class="fas fa-dollar-sign"></i> 
              Vol: {{ formatMoney(event.volume) }}
            </span>
            <span v-if="event.liquidity">
              <i class="fas fa-water"></i> 
              Liq: {{ formatMoney(event.liquidity) }}
            </span>
          </div>
        </div>

        <!-- Markets Section -->
        <div class="markets-section" v-if="event.markets && event.markets.length">
          <div class="section-title">
            <i class="fas fa-chart-simple"></i> Prediction Markets ({{ event.markets.length }})
          </div>
          
          <div v-for="market in event.markets" :key="market.id" class="market-item">
            <div class="market-question">
              {{ market.question }}
            </div>
            
            <!-- Poll Answers / Outcomes -->
            <div class="outcomes-area">
              <div 
                v-if="market.outcomes && market.outcomes.length" 
                v-for="(outcome, idx) in parseOutcomes(market.outcomes)" 
                :key="idx" 
                class="poll-option"
              >
                <div class="option-label">
                  <span><strong>{{ outcome }}</strong></span>
                  <span>{{ formatPercent(getOutcomePrice(market, idx)) }}</span>
                </div>
                <div class="prob-bar-bg">
                  <div 
                    class="prob-bar" 
                    :class="{ highlight: isHighestProb(market, idx) }" 
                    :style="{ width: getProbWidth(getOutcomePrice(market, idx)) }"
                  ></div>
                </div>
              </div>

              <!-- Market Stats -->
              <div class="market-stats">
                <span v-if="market.volumeNum">
                  <i class="fas fa-chart-line"></i> Volume: {{ formatMoney(market.volumeNum) }}
                </span>
                <span v-if="market.liquidityNum">
                  <i class="fas fa-water"></i> Liquidity: {{ formatMoney(market.liquidityNum) }}
                </span>
                <span v-if="market.closed">
                  <i class="fas fa-lock"></i> Closed
                </span>
                <span v-if="market.closedTime">
                  <i class="fas fa-clock"></i> Closed: {{ formatDate(market.closedTime) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Series Info (if available) -->
        <div class="series-info" v-if="event.series && event.series.length">
          <div class="series-tag" v-for="series in event.series" :key="series.id">
            <i class="fas fa-layer-group"></i> {{ series.title }}
          </div>
        </div>

        <!-- Tags -->
        <div class="tags-section" v-if="event.tags && event.tags.length">
          <div class="tag" v-for="tag in event.tags" :key="tag.id">
            <i class="fas fa-hashtag"></i> {{ tag.label }}
          </div>
        </div>

        <!-- Comment Count -->
        <div class="event-footer" v-if="event.commentCount">
          <i class="fas fa-comments"></i> {{ event.commentCount.toLocaleString() }} comments
        </div>
      </div>
    </div>

    <!-- Pagination / Next Cursor -->
    <div class="pagination" v-if="nextCursor && !loading && events.length > 0">
      <button @click="loadMore" class="load-more-btn">
        <i class="fas fa-arrow-down"></i> Load More Events
      </button>
    </div>

    <!-- Footer -->
    <footer>
      <i class="fas fa-chart-simple"></i> Data sourced from Polymarket Gamma API | Real-time prediction markets
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'PolymarketEvents',
  setup() {
    // Reactive data
    const events = ref([])
    const loading = ref(false)
    const error = ref(null)
    const lastUpdated = ref(null)
    const searchQuery = ref('')
    const activeStatusFilter = ref('all')
    const selectedCategory = ref('all')
    const nextCursor = ref(null)
    const limit = ref(20)
    const ascending = ref(false)

    // Filter options
    const statusFilters = [
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Closed', value: 'closed' },
      { label: 'Archived', value: 'archived' }
    ]

    // Helper Functions
    const formatDate = (dateString) => {
      if (!dateString) return null
      try {
        const d = new Date(dateString)
        if (isNaN(d.getTime())) return null
        return d.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      } catch(e) { 
        return null 
      }
    }

    const getEventStatus = (event) => {
      if (event.archived) return 'Archived'
      if (event.closed) return 'Closed'
      if (event.active) return 'Active'
      return 'Unknown'
    }

    const getEventStatusClass = (event) => {
      if (event.archived) return 'archived'
      if (event.closed) return 'closed'
      if (event.active) return 'active'
      return ''
    }

    const parseOutcomes = (outcomesStr) => {
      if (!outcomesStr) return []
      try {
        if (typeof outcomesStr === 'string') {
          return JSON.parse(outcomesStr)
        }
        if (Array.isArray(outcomesStr)) {
          return outcomesStr
        }
        return []
      } catch(e) {
        return []
      }
    }

    const getOutcomePrice = (market, idx) => {
      if (!market.outcomePrices) return null
      try {
        let prices = market.outcomePrices
        if (typeof prices === 'string') {
          prices = JSON.parse(prices)
        }
        if (Array.isArray(prices) && prices[idx]) {
          return parseFloat(prices[idx])
        }
        return null
      } catch(e) {
        return null
      }
    }

    const formatPercent = (prob) => {
      if (prob === undefined || prob === null) return '—'
      let p = typeof prob === 'number' ? prob : parseFloat(prob)
      if (isNaN(p)) return '—'
      return `${(p * 100).toFixed(1)}%`
    }

    const getProbWidth = (prob) => {
      if (prob === undefined || prob === null) return '0%'
      let p = typeof prob === 'number' ? prob : parseFloat(prob)
      if (isNaN(p)) return '0%'
      return `${Math.min(100, p * 100)}%`
    }

    const isHighestProb = (market, idx) => {
      if (!market.outcomePrices) return false
      try {
        let prices = market.outcomePrices
        if (typeof prices === 'string') {
          prices = JSON.parse(prices)
        }
        if (!Array.isArray(prices)) return false
        
        const probs = prices.map(p => parseFloat(p))
        const current = probs[idx]
        if (current === undefined || isNaN(current)) return false
        const maxProb = Math.max(...probs.filter(p => !isNaN(p)))
        return current === maxProb && maxProb > 0
      } catch(e) {
        return false
      }
    }

    const formatMoney = (value) => {
      if (value === undefined || value === null) return '—'
      let num = typeof value === 'number' ? value : parseFloat(value)
      if (isNaN(num)) return '—'
      if (num > 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
      if (num > 1_000) return `$${(num / 1_000).toFixed(1)}K`
      return `$${num.toFixed(0)}`
    }

    const truncate = (str, len) => {
      if (!str) return ''
      return str.length > len ? str.substring(0, len) + '…' : str
    }

    // Computed: Unique categories
    const uniqueCategories = computed(() => {
      const cats = new Set()
      events.value.forEach(event => {
        if (event.category) cats.add(event.category)
      })
      return Array.from(cats).sort()
    })

    // Computed: Total volume
    const totalVolume = computed(() => {
      return events.value.reduce((sum, event) => sum + (parseFloat(event.volume) || 0), 0)
    })

    // Computed: Filtered events
    const filteredEvents = computed(() => {
      let result = events.value
      
      // Status filter
      if (activeStatusFilter.value !== 'all') {
        result = result.filter(event => {
          if (activeStatusFilter.value === 'active') return event.active && !event.closed
          if (activeStatusFilter.value === 'closed') return event.closed
          if (activeStatusFilter.value === 'archived') return event.archived
          return true
        })
      }
      
      // Category filter
      if (selectedCategory.value !== 'all') {
        result = result.filter(event => event.category === selectedCategory.value)
      }
      
      // Search filter
      if (searchQuery.value.trim()) {
        const lowerQuery = searchQuery.value.toLowerCase()
        result = result.filter(event => {
          const matchTitle = event.title?.toLowerCase().includes(lowerQuery)
          const matchDesc = event.description?.toLowerCase().includes(lowerQuery)
          const matchTicker = event.ticker?.toLowerCase().includes(lowerQuery)
          const matchMarkets = event.markets?.some(m => 
            m.question?.toLowerCase().includes(lowerQuery)
          )
          return matchTitle || matchDesc || matchTicker || matchMarkets
        })
      }
      
      return result
    })

    // API Fetch Function using the exact request format you provided
    const fetchEvents = async (cursor = null) => {
      loading.value = true
      error.value = null
      
      try {
        // Build the request body matching your format
        const requestBody = {
          method: "GET",
          url: "https://gamma-api.polymarket.com/events",
          body: {
            default: true
          }
        }
        
        // Add query parameters
        const params = new URLSearchParams()
        params.append('limit', limit.value.toString())
        params.append('ascending', ascending.value.toString())
        
        if (cursor) {
          params.append('cursor', cursor)
        }
        
        const fullUrl = `${requestBody.url}?${params.toString()}`
        
        // Make the request to Polymarket Gamma API directly
        const response = await fetch(fullUrl, {
          method: requestBody.method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Handle the response structure
        let eventsData = data.events || data
        
        if (!eventsData || !Array.isArray(eventsData)) {
          throw new Error('Unexpected API format from Polymarket')
        }

        // Transform and enrich events data
        const enrichedEvents = eventsData.map(event => ({
          ...event,
          // Ensure markets is always an array
          markets: event.markets || [],
          // Parse numeric values
          volumeNum: parseFloat(event.volume) || 0,
          liquidityNum: parseFloat(event.liquidity) || 0,
          // Add display title
          displayTitle: event.title || event.ticker?.replace(/-/g, ' ') || 'Untitled Event'
        }))

        if (cursor) {
          // Append to existing events
          events.value = [...events.value, ...enrichedEvents]
        } else {
          // Replace all events
          events.value = enrichedEvents
        }
        
        // Get next cursor from response
        nextCursor.value = data.next_cursor || null
        lastUpdated.value = new Date().toLocaleString()
        loading.value = false
      } catch (err) {
        console.error('Polymarket Gamma API error:', err)
        error.value = `Failed to load events: ${err.message}. Please check your connection and try again.`
        loading.value = false
      }
    }

    const loadMore = () => {
      if (nextCursor.value && !loading.value) {
        fetchEvents(nextCursor.value)
      }
    }

    const refreshEvents = () => {
      nextCursor.value = null
      fetchEvents()
    }

    // Lifecycle
    onMounted(() => {
      fetchEvents()
    })

    return {
      events,
      loading,
      error,
      lastUpdated,
      searchQuery,
      activeStatusFilter,
      selectedCategory,
      limit,
      ascending,
      statusFilters,
      uniqueCategories,
      filteredEvents,
      totalVolume,
      nextCursor,
      refreshEvents,
      loadMore,
      formatDate,
      getEventStatus,
      getEventStatusClass,
      parseOutcomes,
      getOutcomePrice,
      formatPercent,
      getProbWidth,
      isHighestProb,
      formatMoney,
      truncate
    }
  }
}
</script>

<style scoped>
.polymarket-container {
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1E2A5E, #2C3E66);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  letter-spacing: -0.3px;
}

.header p {
  color: #475569;
  margin-top: 0.5rem;
  font-size: 1rem;
}

.badge {
  background: #eef2ff;
  border-radius: 40px;
  padding: 0.3rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #1e40af;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 12px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 0.8rem 1.5rem;
  border-radius: 60px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
}

.search-box {
  flex: 2;
  min-width: 200px;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 40px;
  padding: 0.4rem 1rem;
  border: 1px solid #e2e8f0;
}

.search-box i {
  color: #94a3b8;
  margin-right: 0.5rem;
}

.search-box input {
  border: none;
  background: transparent;
  padding: 0.6rem 0;
  font-size: 0.9rem;
  width: 100%;
  outline: none;
  font-family: inherit;
}

.limit-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #475569;
}

.limit-select {
  padding: 0.4rem 0.8rem;
  border-radius: 40px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-family: inherit;
  cursor: pointer;
  outline: none;
}

.category-filter {
  min-width: 150px;
}

.category-select {
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 40px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
}

.status-filter {
  display: flex;
  gap: 0.5rem;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 48px;
}

.filter-btn {
  border: none;
  background: transparent;
  padding: 0.4rem 1.2rem;
  border-radius: 40px;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  color: #334155;
}

.filter-btn.active {
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  color: #0f172a;
  font-weight: 600;
}

.refresh-btn {
  background: #1e293b;
  border: none;
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 40px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: 0.2s;
  font-family: inherit;
}

.refresh-btn:hover:not(:disabled) {
  background: #0f172a;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats {
  display: flex;
  justify-content: space-between;
  background: white;
  border-radius: 24px;
  padding: 0.8rem 1.8rem;
  margin-bottom: 1.8rem;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #eef2ff;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.events-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.8rem;
}

.event-card {
  background: white;
  border-radius: 28px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  border: 1px solid #eef2ff;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 30px -12px rgba(0,0,0,0.1);
  border-color: #cbd5e1;
}

.event-header {
  padding: 1.5rem 1.8rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-bottom: 1px solid #eef2ff;
}

.event-category {
  display: inline-block;
  background: #eef2ff;
  padding: 0.2rem 0.8rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 0.8rem;
}

.event-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.event-description {
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0.5rem 0;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.8rem;
  font-size: 0.75rem;
  color: #5b6e8c;
}

.status {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.65rem;
  padding: 0.2rem 0.6rem;
  border-radius: 30px;
}

.status.active { 
  background: #dcfce7; 
  color: #15803d; 
}

.status.closed { 
  background: #f1f5f9; 
  color: #475569; 
}

.status.archived { 
  background: #fef3c7; 
  color: #92400e; 
}

.markets-section {
  padding: 1.2rem 1.8rem;
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: #3b82f6;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.market-item {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed #e2e8f0;
}

.market-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.market-question {
  font-weight: 600;
  font-size: 1rem;
  color: #1e293b;
  margin-bottom: 0.8rem;
}

.outcomes-area {
  margin-top: 0.5rem;
}

.poll-option {
  margin-bottom: 0.8rem;
}

.option-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #1e293b;
}

.prob-bar-bg {
  background: #e2e8f0;
  border-radius: 40px;
  height: 8px;
  overflow: hidden;
  width: 100%;
}

.prob-bar {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  height: 100%;
  width: 0%;
  border-radius: 40px;
  transition: width 0.3s ease;
}

.prob-bar.highlight {
  background: linear-gradient(90deg, #10b981, #059669);
}

.market-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.8rem;
  font-size: 0.7rem;
  color: #6c757d;
  flex-wrap: wrap;
}

.series-info {
  padding: 0.8rem 1.8rem;
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  border-bottom: 1px solid #f1f5f9;
}

.series-tag {
  background: #f1f5f9;
  padding: 0.2rem 0.8rem;
  border-radius: 20px;
  font-size: 0.7rem;
  color: #475569;
}

.tags-section {
  padding: 0.8rem 1.8rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  border-bottom: 1px solid #f1f5f9;
}

.tag {
  background: #eef2ff;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.65rem;
  color: #1e40af;
}

.event-footer {
  padding: 0.8rem 1.8rem;
  font-size: 0.75rem;
  color: #6c757d;
  background: #fafcfc;
}

.pagination {
  margin-top: 2rem;
  text-align: center;
}

.load-more-btn {
  background: #1e293b;
  border: none;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 40px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: 0.2s;
  font-family: inherit;
}

.load-more-btn:hover {
  background: #0f172a;
}

.loading-state, 
.error-state, 
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 2rem;
  margin-top: 2rem;
}

.retry-btn {
  margin-top: 1rem;
  background: #3b82f6;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 30px;
  color: white;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
}

.retry-btn:hover {
  background: #2563eb;
}

footer {
  margin-top: 3rem;
  text-align: center;
  font-size: 0.75rem;
  color: #6c757d;
  padding: 1rem;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
    border-radius: 28px;
  }
  
  .status-filter {
    justify-content: center;
  }
  
  .event-title {
    font-size: 1.1rem;
  }
  
  .stats {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .limit-control {
    justify-content: space-between;
  }
}
</style> -->