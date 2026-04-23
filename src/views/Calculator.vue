<template>
  <div class="gold-calculator">
    <!-- Header -->
    <header class="calculator-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">🏆</div>
          <div>
            <h1> Leverage Calculator </h1>
            <p class="subtitle">Portfolio Calculator</p>
          </div>
        </div>

        <div class="header-actions">
          <div class="connection-status" :class="connectionState">
            <span class="status-dot"></span>
            <span>{{ connectionMessage }}</span>
          </div>
          <button class="icon-btn" @click="saveToCache" title="Save to cache">
            💾
          </button>
          <button class="icon-btn" @click="loadFromCache" title="Load from cache">
            📂
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content - Mobile Optimized -->
    <div class="mobile-container">
      <!-- Account Summary -->
      <div class="account-card">
        <div class="card-title">
          <span>💰 Account Overview</span>
        </div>
        <div class="input-group">
          <div class="input-row">
            <label>Gold Price</label>
            <div class="price-input">
              <!-- <span class="currency">$</span> -->
              <input type="number" v-model="currentGoldPrice" @input="handleInput" step="0.01" />
              <button class="refresh-btn" @click="fetchGoldPrice" :disabled="loading" :class="{ spinning: loading }">
                ↻
              </button>
            </div>
          </div>

          <div class="input-row">
            <label>Balance 🪙</label>
            <div class="price-input">
              <input type="number" v-model="accountBalance" @input="handleInput" step="100" />
            </div>
          </div>

          <div class="input-row">
            <label>Leverage (All Positions)</label>
            <div class="price-input">
              <input type="number" v-model="globalLeverage" @input="handleInput" min="1" step="1" />
              <span class="suffix">x</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Positions Section -->
      <div class="positions-section">
        <div class="section-header">
          <div class="title-with-count">
            <span>📊 Positions</span>
            <span class="count-badge">{{ positions.length }}</span>
          </div>
          <button class="add-btn" @click="addPosition">
            ➕ Add
          </button>
        </div>

        <!-- Position Cards (Mobile Optimized) -->
        <div class="positions-list">
          <div v-for="(position, index) in positions" :key="index" class="position-card" :class="position.type">
            <div class="card-header">
              <div class="position-number">Position #{{ index + 1 }}</div>
              <button class="remove-btn" @click="removePosition(index)" v-if="positions.length > 1">
                ✕
              </button>
            </div>

            <div class="type-selector">
              <button class="type-option" :class="{ active: position.type === 'long' }"
                @click="position.type = 'long'; handlePositionChange()">
                📈 Long
              </button>
              <button class="type-option" :class="{ active: position.type === 'short' }"
                @click="position.type = 'short'; handlePositionChange()">
                📉 Short
              </button>
            </div>

            <div class="input-fields">
              <div class="field">
                <label>Lots</label>
                <input type="number" v-model="position.lots" @input="handlePositionChange" step="0.01" min="0"
                  placeholder="0.01" style="width: 100px;" />
              </div>
              <div class="field">
                <label>Entry Price</label>
                <div class="price-input small">
                  <span class="currency">$</span>
                  <input type="number" 
                    v-model.number="position.entryPrice" 
                    @blur="formatEntryPrice" step="0.001"
                    placeholder="0.00" style="width: 150px;" />
                </div>
              </div>
            </div>

            <div class="position-stats">
              <div class="stat">
                <span>P&L</span>
                <strong :class="getPnlClass(position)">{{ formatUSD(calculatePositionPnl(position)) }}</strong>
              </div>
              <div class="stat">
                <span>Liq Price</span>
                <strong>{{ formatUSD(calculateIndividualLiquidation(position)) }}</strong>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="positions.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No positions yet</p>
            <button class="add-btn large" @click="addPosition">Add Your First Position</button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="action-btn" @click="duplicateLastPosition">📋 Duplicate</button>
          <button class="action-btn" @click="resetToExample">📋 Example</button>
          <button class="action-btn" @click="sortPositions">🔽 Sort</button>
          <button class="action-btn danger" @click="clearAll">🗑️ Clear</button>
        </div>
      </div>

      <!-- Portfolio Summary (Mobile Optimized) -->
      <div class="portfolio-summary" v-if="hasValidInputs">
        <div class="risk-badge" :class="riskLevelClass">
          <span>⚠️ Risk Level: {{ riskLevel }}</span>
        </div>

        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">Total P&L</div>
            <div class="metric-value" :class="totalPnlClass">{{ formatUSD(totalPnl) }}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Margin Used</div>
            <div class="metric-value">{{ formatUSD(totalMarginUsed) }}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Equity</div>
            <div class="metric-value">{{ formatUSD(currentEquity) }}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Exposure</div>
            <div class="metric-value">{{ formatUSD(totalPositionValue) }}</div>
          </div>
        </div>

        <div class="liquidation-info">
          <div class="liq-title">Portfolio Liquidation</div>
          <div class="liq-price">{{ formatUSD(portfolioLiquidationPrice) }}</div>
          <div class="distance-bar">
            <div class="bar-fill" :class="distanceClass" :style="{ width: Math.min(percentageDistance, 100) + '%' }">
            </div>
          </div>
          <div class="distance-text">{{ formatPercentage(percentageDistance) }} from current price</div>
        </div>

        <div v-if="showWarning" class="warning-message" :class="warningLevel">
          <span>⚠️</span>
          <span>{{ warningMessage }}</span>
        </div>
      </div>

      <!-- Empty Summary -->
      <div class="portfolio-summary empty" v-else>
        <div class="empty-summary">
          <div class="empty-icon">📊</div>
          <p>Add positions to see analysis</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Cache management
const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

const loadFromLocalStorage = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Failed to load from localStorage:', e)
    return null
  }
}

// Cache keys
const CALCULATOR_CACHE_KEY = 'gold_calculator_cache'

// Gold price API
const GOLD_API_URL = 'https://api.gold-api.com/price/XAU'

// Props
const props = defineProps({
  initialGoldPrice: {
    type: Number,
    default: 4870.148
  },
  initialBalance: {
    type: Number,
    default: 10000
  },
  initialLeverage: {
    type: Number,
    default: 10
  }
})

// State
const currentGoldPrice = ref(props.initialGoldPrice)
const accountBalance = ref(props.initialBalance)
const globalLeverage = ref(props.initialLeverage)
const loading = ref(false)
const connectionState = ref('disconnected')
const connectionMessage = ref('Offline')

// Positions array
const positions = ref([
  {
    type: 'long',
    lots: 0.1,
    entryPrice: 4870.148
  }
])

// Constants
const GOLD_UNIT_PER_LOT = 100

// ============== GOLD PRICE FETCHING ==============
const fetchGoldPrice = async () => {
  if (loading.value) return

  loading.value = true

  try {
    const response = await fetch(GOLD_API_URL)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    currentGoldPrice.value = data.price
    connectionState.value = 'connected'
    connectionMessage.value = 'Live'

    saveToCache()

  } catch (err) {
    console.error('Failed to fetch gold price:', err)
    connectionState.value = 'disconnected'
    connectionMessage.value = 'Offline'
  } finally {
    loading.value = false
  }
}

// Auto-fetch every 2 minutes
let priceInterval = null

const startPricePolling = () => {
  fetchGoldPrice()
  priceInterval = setInterval(fetchGoldPrice, 120000)
}

const stopPricePolling = () => {
  if (priceInterval) {
    clearInterval(priceInterval)
    priceInterval = null
  }
}

// ============== CACHE MANAGEMENT ==============
const saveToCache = () => {
  try {
    const cacheData = {
      currentGoldPrice: currentGoldPrice.value,
      accountBalance: accountBalance.value,
      globalLeverage: globalLeverage.value,
      positions: positions.value,
      timestamp: new Date().toISOString()
    }

    saveToLocalStorage(CALCULATOR_CACHE_KEY, cacheData)
  } catch (err) {
    console.error('Failed to save to cache:', err)
  }
}

const loadFromCache = () => {
  try {
    const cached = loadFromLocalStorage(CALCULATOR_CACHE_KEY)

    if (cached && cached.positions) {
      positions.value = cached.positions.map(pos => ({
        type: pos.type || 'long',
        lots: Number(pos.lots) || 0.1,
        entryPrice: Number(pos.entryPrice) || 0
      }))

      currentGoldPrice.value = cached.currentGoldPrice || currentGoldPrice.value
      accountBalance.value = cached.accountBalance || accountBalance.value
      globalLeverage.value = cached.globalLeverage || props.initialLeverage
    }
  } catch (err) {
    console.error('Failed to load from cache:', err)
  }
}

// ============== INPUT HANDLING ==============
const handleInput = () => {
  saveToCache()
}

const handlePositionChange = () => {
  if (this.position.entryPrice) {
    this.position.entryPrice = parseFloat(this.position.entryPrice.toFixed(3));
  }
  saveToCache()
}

// ============== POSITION MANAGEMENT ==============
const addPosition = () => {
  positions.value.push({
    type: 'long',
    lots: 0.1,
    entryPrice: currentGoldPrice.value
  })
  handlePositionChange()

  // Auto-scroll to new position on mobile
  setTimeout(() => {
    const positionsList = document.querySelector('.positions-list')
    if (positionsList) {
      positionsList.scrollTop = positionsList.scrollHeight
    }
  }, 100)
}

const removePosition = (index) => {
  positions.value.splice(index, 1)
  handlePositionChange()
}

const duplicateLastPosition = () => {
  if (positions.value.length > 0) {
    const lastPos = positions.value[positions.value.length - 1]
    positions.value.push({
      type: lastPos.type,
      lots: lastPos.lots,
      entryPrice: lastPos.entryPrice
    })
    handlePositionChange()
  }
}

const sortPositions = () => {
  positions.value.sort((a, b) => b.entryPrice - a.entryPrice)
  handlePositionChange()
}

const resetToExample = () => {
  currentGoldPrice.value = 4870.148
  accountBalance.value = 10000
  globalLeverage.value = 10
  positions.value = [
    {
      type: 'long',
      lots: 0.1,
      entryPrice: 4870.148
    },
    {
      type: 'short',
      lots: 0.05,
      entryPrice: 4880.000
    },
    {
      type: 'long',
      lots: 0.2,
      entryPrice: 4860.500
    }
  ]
  handleInput()
}

const clearAll = () => {
  if (confirm('Clear all positions?')) {
    positions.value = []
    handleInput()
  }
}

// ============== CALCULATIONS ==============
const totalLots = computed(() => {
  return positions.value.reduce((sum, pos) => sum + Number(pos.lots), 0)
})

const totalPositionValue = computed(() => {
  return positions.value.reduce((sum, pos) => {
    return sum + (pos.lots * GOLD_UNIT_PER_LOT * pos.entryPrice)
  }, 0)
})

const calculateMarginUsed = (position) => {
  const positionValue = position.lots * GOLD_UNIT_PER_LOT * position.entryPrice
  return positionValue / globalLeverage.value
}

const totalMarginUsed = computed(() => {
  return positions.value.reduce((sum, pos) => {
    return sum + calculateMarginUsed(pos)
  }, 0)
})

const calculatePositionPnl = (position) => {
  const priceDiff = currentGoldPrice.value - position.entryPrice
  const rawPnl = position.lots * GOLD_UNIT_PER_LOT * priceDiff
  return position.type === 'long' ? rawPnl : -rawPnl
}

const calculatePositionPnlPercentage = (position) => {
  const positionValue = position.lots * GOLD_UNIT_PER_LOT * position.entryPrice
  const marginUsed = positionValue / globalLeverage.value
  const pnl = calculatePositionPnl(position)
  return marginUsed ? (pnl / marginUsed) * 100 : 0
}

const totalPnl = computed(() => {
  return positions.value.reduce((sum, pos) => {
    return sum + calculatePositionPnl(pos)
  }, 0)
})

const currentEquity = computed(() => {
  return accountBalance.value + totalPnl.value
})

const calculateIndividualLiquidation = (position) => {
  const positionValue = position.lots * GOLD_UNIT_PER_LOT * position.entryPrice
  const marginUsed = positionValue / globalLeverage.value
  const maintenanceMargin = positionValue * 0.005

  const maxLoss = marginUsed - maintenanceMargin
  const priceMove = maxLoss / (position.lots * GOLD_UNIT_PER_LOT)

  if (position.type === 'long') {
    return position.entryPrice - priceMove
  } else {
    return position.entryPrice + priceMove
  }
}

const portfolioLiquidationPrice = computed(() => {
  if (totalMarginUsed.value <= 0 || currentEquity.value <= 0) return 0

  let totalDelta = 0

  positions.value.forEach(pos => {
    const size = pos.lots * GOLD_UNIT_PER_LOT
    if (pos.type === 'long') {
      totalDelta += size
    } else {
      totalDelta -= size
    }
  })

  if (totalDelta === 0) return currentGoldPrice.value

  const maintenanceMargin = totalPositionValue.value * 0.005
  const maxLoss = currentEquity.value - maintenanceMargin

  if (totalDelta > 0) {
    return currentGoldPrice.value - (maxLoss / Math.abs(totalDelta))
  } else {
    return currentGoldPrice.value + (maxLoss / Math.abs(totalDelta))
  }
})

const priceDistance = computed(() => {
  return Math.abs(currentGoldPrice.value - portfolioLiquidationPrice.value)
})

const percentageDistance = computed(() => {
  return currentGoldPrice.value ? (priceDistance.value / currentGoldPrice.value) * 100 : 0
})

const hasValidInputs = computed(() => {
  return currentGoldPrice.value > 0 &&
    accountBalance.value > 0 &&
    globalLeverage.value > 0 &&
    positions.value.length > 0 &&
    positions.value.every(p => p.lots > 0 && p.entryPrice > 0)
})

const totalPnlClass = computed(() => {
  if (totalPnl.value > 0) return 'positive'
  if (totalPnl.value < 0) return 'negative'
  return ''
})

const getPnlClass = (position) => {
  const pnl = calculatePositionPnl(position)
  if (pnl > 0) return 'positive'
  if (pnl < 0) return 'negative'
  return ''
}

const distanceClass = computed(() => {
  if (percentageDistance.value < 3) return 'danger'
  if (percentageDistance.value < 7) return 'warning'
  return 'safe'
})

const riskLevel = computed(() => {
  const ratio = Math.abs(totalPnl.value) / accountBalance.value
  if (ratio > 0.5) return 'Critical'
  if (ratio > 0.3) return 'High'
  if (ratio > 0.15) return 'Medium'
  return 'Low'
})

const riskLevelClass = computed(() => {
  return riskLevel.value.toLowerCase()
})

const showWarning = computed(() => {
  return percentageDistance.value < 5 || Math.abs(totalPnl.value) > accountBalance.value * 0.5
})

const warningMessage = computed(() => {
  if (Math.abs(totalPnl.value) > accountBalance.value * 0.5) {
    return 'High drawdown - Portfolio at risk!'
  }
  if (percentageDistance.value < 3) {
    return 'Critical: Close to liquidation!'
  }
  if (percentageDistance.value < 5) {
    return 'Warning: Approaching liquidation'
  }
  return ''
})

const warningLevel = computed(() => {
  if (percentageDistance.value < 3) return 'critical'
  if (percentageDistance.value < 5) return 'warning'
  return 'info'
})

// Formatting helpers
const formatUSD = (value) => {
  if (isNaN(value) || !isFinite(value)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatPercentage = (value) => {
  if (isNaN(value) || !isFinite(value)) return '0.00%'
  return value.toFixed(2) + '%'
}

// Watch for changes
watch([currentGoldPrice, accountBalance, globalLeverage, positions], () => {
  // Auto-save on any change
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadFromCache()
  startPricePolling()
})

onUnmounted(() => {
  stopPricePolling()
})
</script>

<style scoped>
  @import '../assets/styles/calculator.css';
</style>