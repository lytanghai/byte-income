<template>
  <div class="polymarket-container">
    <!-- Header Section -->
    <div class="header">
      <h1>
        <i class="fas fa-chart-line" style="margin-right: 10px; color: #3b82f6;"></i> 
        Polymarket Polls
      </h1>
      <p>Explore real-time prediction markets & question polls from Polymarket API</p>
      <div class="badge">
        <i class="fas fa-database"></i> Live from Polymarket Gamma
      </div>
    </div>

    <!-- Controls Section -->
    <div class="controls">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Filter by question or description..."
        />
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
      <button class="refresh-btn" @click="fetchMarkets" :disabled="loading">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        Refresh
      </button>
    </div>

    <!-- Stats Section -->
    <div class="stats" v-if="!loading && filteredMarkets.length > 0">
      <span><i class="fas fa-chart-simple"></i> Showing {{ filteredMarkets.length }} markets</span>
      <span><i class="fas fa-clock"></i> Last update: {{ lastUpdated || '—' }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-pulse fa-2x" style="color:#3b82f6"></i>
      <p style="margin-top: 1rem;">Loading prediction markets from Polymarket...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-circle-exclamation fa-2x" style="color:#ef4444"></i>
      <p style="margin-top: 0.5rem; font-weight: 500;">{{ error }}</p>
      <button @click="fetchMarkets" class="retry-btn">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredMarkets.length === 0" class="empty-state">
      <i class="fas fa-poll fa-2x" style="color:#94a3b8"></i>
      <p>No markets match your filters or search.</p>
      <p style="font-size: 0.8rem;">Try adjusting keywords or status.</p>
    </div>

    <!-- Markets Grid -->
    <div class="markets-grid" v-else>
      <div v-for="market in filteredMarkets" :key="market.id" class="market-card">
        <div class="card-header">
          <div class="question">{{ market.question || market.title || 'Untitled Market' }}</div>
          <div class="meta-info">
            <span class="status" :class="marketStatusClass(market)">
              {{ formatStatus(market) }}
            </span>
            <span>
              <i class="far fa-calendar-alt"></i> 
              {{ formatDate(market.endDate) || 'Open ended' }}
            </span>
            <span v-if="market.ticker">
              <i class="fas fa-tag"></i> {{ market.ticker }}
            </span>
          </div>
        </div>

        <div class="outcome-area">
          <!-- Poll Answers / Outcomes -->
          <div 
            v-if="market.outcomes && market.outcomes.length" 
            v-for="(outcome, idx) in market.outcomes" 
            :key="idx" 
            class="poll-option"
          >
            <div class="option-label">
              <span><strong>{{ outcome.name || `Option ${idx+1}` }}</strong></span>
              <span>{{ formatPercent(market.probabilities?.[idx]) }}</span>
            </div>
            <div class="prob-bar-bg">
              <div 
                class="prob-bar" 
                :class="{ highlight: isHighestProb(market, idx) }" 
                :style="{ width: getProbWidth(market.probabilities?.[idx]) }"
              ></div>
            </div>
          </div>

          <!-- Fallback for markets without structured outcomes -->
          <div v-if="(!market.outcomes || market.outcomes.length === 0) && market.description" class="poll-option">
            <div class="option-label">
              <span><i class="fas fa-info-circle"></i> Description</span>
            </div>
            <p class="description-text">{{ truncate(market.description, 110) }}</p>
            <div v-if="market.probability" class="fallback-probability">
              <span style="font-size:0.7rem;">Implied probability: {{ (market.probability * 100).toFixed(1) }}%</span>
              <div class="prob-bar-bg">
                <div class="prob-bar" :style="{ width: (market.probability * 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- Additional Stats -->
          <div class="extra-stats">
            <span class="volume" v-if="market.volume">
              <i class="fas fa-dollar-sign"></i> Vol: {{ formatMoney(market.volume) }}
            </span>
            <span v-if="market.liquidity">
              <i class="fas fa-water"></i> Liq: {{ formatMoney(market.liquidity) }}
            </span>
            <span v-if="market.active !== undefined">
              <i class="fas fa-chart-line"></i> {{ market.active ? 'Active' : 'Closed' }}
            </span>
          </div>
        </div>
      </div>
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
  name: 'Polymarket',
  setup() {
    // Reactive data
    const markets = ref([])
    const loading = ref(false)
    const error = ref(null)
    const lastUpdated = ref(null)
    const searchQuery = ref('')
    const activeStatusFilter = ref('all')

    // Filter options
    const statusFilters = [
      { label: 'All Markets', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Resolved', value: 'resolved' },
      { label: 'Ended', value: 'ended' }
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

    const getMarketStatus = (market) => {
      if (market.resolved === true || market.resolvedAt) return 'resolved'
      if (market.closed === true || (market.endDate && new Date(market.endDate) < new Date())) return 'ended'
      if (market.active === false) return 'ended'
      return 'active'
    }

    const formatStatus = (market) => {
      const status = getMarketStatus(market)
      if (status === 'resolved') return 'Resolved'
      if (status === 'ended') return 'Ended'
      return 'Active'
    }

    const marketStatusClass = (market) => {
      const status = getMarketStatus(market)
      if (status === 'resolved') return 'resolved'
      if (status === 'ended') return 'ended'
      return 'active'
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
      if (!market.probabilities || market.probabilities.length === 0) return false
      const probs = market.probabilities.map(p => typeof p === 'number' ? p : parseFloat(p))
      const current = probs[idx]
      if (current === undefined || isNaN(current)) return false
      const maxProb = Math.max(...probs.filter(p => !isNaN(p)))
      return current === maxProb && maxProb > 0
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

    // API Fetch Function
    const fetchMarkets = async () => {
      loading.value = true
      error.value = null
      
      try {
        const url = 'https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume_24hr&ascending=false'
        const response = await fetch(url)
        
        if (!response.ok) throw new Error(`API responded with status ${response.status}`)
        
        const data = await response.json()
        
        if (!Array.isArray(data)) throw new Error('Unexpected API format')

        // Transform API data to uniform structure
        const enrichedMarkets = data.map(m => {
          let outcomes = []
          let probabilities = []
          
          // Parse outcomes from Polymarket API
          if (m.outcomes && Array.isArray(m.outcomes)) {
            outcomes = m.outcomes.map(out => {
              if (typeof out === 'string') return { name: out, ticker: null }
              return { name: out.name || out, ticker: out.ticker || null }
            })
            
            if (m.outcomePrices && Array.isArray(m.outcomePrices)) {
              probabilities = m.outcomePrices.map(p => {
                if (p === undefined) return null
                const priceNum = parseFloat(p)
                return isNaN(priceNum) ? null : priceNum
              })
            } else {
              probabilities = outcomes.map(() => null)
            }
          } 
          // Fallback for binary markets
          else if (m.price !== undefined && m.negPrice !== undefined) {
            outcomes = [{ name: m.outcome || 'Yes' }, { name: m.outcomeNegative || 'No' }]
            probabilities = [parseFloat(m.price) || 0, parseFloat(m.negPrice) || 0]
          } 
          else if (m.probability !== undefined && !isNaN(m.probability)) {
            outcomes = [{ name: 'Yes' }, { name: 'No' }]
            const yesProb = parseFloat(m.probability)
            probabilities = [yesProb, 1 - yesProb]
          }

          // Normalize probabilities
          if (probabilities.length) {
            probabilities = probabilities.map(p => 
              (p !== null && !isNaN(p)) ? Math.min(1, Math.max(0, p)) : null
            )
          }

          return {
            id: m.id || m.marketId || m.slug || Math.random().toString(36),
            question: m.question || m.title || m.description_short || m.name || 'Polymarket question',
            title: m.title || m.question,
            description: m.description || m.description_short || '',
            outcomes: outcomes,
            probabilities: probabilities,
            volume: m.volume24hr || m.volume || m.volumeUSD || null,
            liquidity: m.liquidity || m.liquidityUSD || null,
            endDate: m.endDate || m.end_date || m.expiration || null,
            resolved: m.resolved === true || m.resolvedAt !== undefined,
            closed: m.closed === true || (m.endDate && new Date(m.endDate) < new Date()),
            active: m.active !== undefined ? m.active : (!m.closed && !m.resolved),
            ticker: m.ticker || null,
            raw: m
          }
        })

        markets.value = enrichedMarkets
        lastUpdated.value = new Date().toLocaleTimeString()
        loading.value = false
      } catch (err) {
        console.error('Polymarket API error:', err)
        error.value = `Failed to load markets: ${err.message}. Please try again later.`
        loading.value = false
      }
    }

    // Computed: Filtered markets based on search & status
    const filteredMarkets = computed(() => {
      let result = markets.value
      
      // Status filter
      if (activeStatusFilter.value !== 'all') {
        result = result.filter(m => getMarketStatus(m) === activeStatusFilter.value)
      }
      
      // Search filter
      if (searchQuery.value.trim()) {
        const lowerQuery = searchQuery.value.toLowerCase()
        result = result.filter(m => {
          const matchQuestion = m.question?.toLowerCase().includes(lowerQuery)
          const matchDesc = m.description?.toLowerCase().includes(lowerQuery)
          const matchOutcome = m.outcomes?.some(out => out.name?.toLowerCase().includes(lowerQuery))
          return matchQuestion || matchDesc || matchOutcome
        })
      }
      
      return result
    })

    // Lifecycle
    onMounted(() => {
      fetchMarkets()
    })

    return {
      markets,
      loading,
      error,
      lastUpdated,
      searchQuery,
      activeStatusFilter,
      statusFilters,
      filteredMarkets,
      fetchMarkets,
      formatDate,
      formatStatus,
      marketStatusClass,
      formatPercent,
      getProbWidth,
      isHighestProb,
      formatMoney,
      truncate,
      getMarketStatus
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
}

.markets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.8rem;
}

.market-card {
  background: white;
  border-radius: 28px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  border: 1px solid #eef2ff;
  display: flex;
  flex-direction: column;
}

.market-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 30px -12px rgba(0,0,0,0.1);
  border-color: #cbd5e1;
}

.card-header {
  padding: 1.2rem 1.4rem 0.6rem 1.4rem;
  border-bottom: 1px solid #f1f5f9;
}

.question {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0.5rem 0 0.3rem;
  font-size: 0.7rem;
  color: #5b6e8c;
}

.status {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.65rem;
  padding: 0.2rem 0.6rem;
  border-radius: 30px;
  background: #eef2ff;
}

.status.resolved { 
  background: #dcfce7; 
  color: #15803d; 
}

.status.active { 
  background: #fff3e3; 
  color: #b45309; 
}

.status.ended { 
  background: #f1f5f9; 
  color: #475569; 
}

.outcome-area {
  padding: 1rem 1.4rem;
  flex: 1;
}

.poll-option {
  margin-bottom: 1rem;
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
  height: 10px;
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

.description-text {
  font-size: 0.8rem;
  color: #475569;
  margin-top: 0.3rem;
}

.fallback-probability {
  margin-top: 0.6rem;
}

.extra-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 0.7rem;
  font-size: 0.7rem;
  color: #4b5563;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.7rem;
}

.volume {
  font-weight: 500;
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

@media (max-width: 700px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
    border-radius: 28px;
  }
  
  .status-filter {
    justify-content: center;
  }
  
  .markets-grid {
    grid-template-columns: 1fr;
  }
}
</style>