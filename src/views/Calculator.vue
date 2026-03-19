<template>
  <div class="gold-calculator">
    <header class="calculator-header">
      <div class="header-top">
        <h2>📊 Gold Trading Portfolio Calculator</h2>
        <div class="connection-status" :class="connectionState">
          <span class="status-dot"></span>
          <span class="status-text">{{ connectionMessage }}</span>
          <span class="last-update" v-if="lastUpdateTime">🕒 {{ lastUpdateTime }}</span>
        </div>
      </div>
      <div class="cache-status" v-if="cacheLoaded">
        <span class="cache-badge">📦 Loaded from cache</span>
      </div>
      <div class="cache-info" v-if="lastCacheTime">
        <span class="cache-time">Last saved: {{ lastCacheTime }} ({{ cachedRowCount }} rows)</span>
      </div>
    </header>
    
    <div class="calculator-grid">
      <!-- Input Section -->
      <div class="input-section card">
        <div class="section-header">
          <h3>📋 Account Overview</h3>
          <div class="header-actions">
            <button class="icon-btn" @click="saveToCache" title="Save to cache">
              💾
            </button>
            <button class="icon-btn" @click="loadFromCache" title="Load from cache">
              📂
            </button>
            <button class="icon-btn" @click="clearCache" title="Clear cache">
              🗑️
            </button>
          </div>
        </div>
        
        <div class="account-summary">
          <div class="input-group">
            <label>
              <span class="label-icon">💰</span>
              Gold Price (USD)
            </label>
            <div class="input-wrapper">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                v-model="currentGoldPrice" 
                @input="handleInput"
                placeholder="0.00"
                inputmode="numeric"
              />
              <button 
                class="refresh-btn" 
                @click="fetchGoldPrice" 
                :disabled="loading"
                :class="{ spinning: loading }"
                title="Refresh price"
              >
                ↻
              </button>
            </div>
          </div>

          <div class="input-group">
            <label>
              <span class="label-icon">💳</span>
              Balance (USDC)
            </label>
            <div class="input-wrapper">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                v-model="accountBalance" 
                @input="handleInput"
                placeholder="0.00"
                inputmode="numeric"
              />
            </div>
          </div>
        </div>

        <div class="section-header">
          <h3>📈 Open Positions <span class="row-count">({{ positions.length }} rows)</span></h3>
          <button class="add-position-btn" @click="addPosition">
            <span>➕</span> Add Row
          </button>
        </div>
        
        <!-- Positions Table -->
        <div class="positions-table-container">
          <table class="positions-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Lots</th>
                <th>Entry</th>
                <th>Lev</th>
                <th>P&L</th>
                <th>P&L%</th>
                <th>Liq</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(position, index) in positions" :key="index" :class="position.type">
                <td class="position-number">{{ index + 1 }}</td>
                <td>
                  <select v-model="position.type" @change="handlePositionChange" class="type-select" :class="position.type">
                    <option value="long">Long 📈</option>
                    <option value="short">Short 📉</option>
                  </select>
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model="position.lots" 
                    @input="handlePositionChange"
                    step="0.01"
                    min="0"
                    inputmode="decimal"
                    class="table-input"
                  />
                </td>
                <td>
                  <div class="input-wrapper table">
                    <span class="input-prefix">$</span>
                    <input 
                      type="number" 
                      v-model="position.entryPrice" 
                      @input="handlePositionChange"
                      inputmode="numeric"
                      class="table-input"
                    />
                  </div>
                </td>
                <td>
                  <div class="input-wrapper table">
                    <input 
                      type="number" 
                      v-model="position.leverage" 
                      @input="handlePositionChange"
                      min="1"
                      inputmode="numeric"
                      class="table-input leverage"
                    />
                    <span class="input-suffix">x</span>
                  </div>
                </td>
                <td :class="getPnlClass(position)" class="pnl-cell">
                  {{ formatUSD(calculatePositionPnl(position)) }}
                </td>
                <td :class="getPnlClass(position)" class="pnl-percent-cell">
                  {{ formatPercentage(calculatePositionPnlPercentage(position)) }}
                </td>
                <td class="liq-cell">
                  {{ formatUSD(calculateIndividualLiquidation(position)) }}
                </td>
                <td>
                  <button class="remove-btn small" @click="removePosition(index)" v-if="positions.length > 1">
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Position Actions -->
        <div class="quick-actions">
          <button class="action-btn secondary" @click="resetToExample">
            <span class="btn-icon">📋</span>
            Example
          </button>
          <button class="action-btn secondary" @click="clearAll">
            <span class="btn-icon">🗑️</span>
            Clear
          </button>
          <button class="action-btn secondary" @click="duplicateLastPosition">
            <span class="btn-icon">📋</span>
            Duplicate
          </button>
          <button class="action-btn secondary" @click="sortPositions">
            <span class="btn-icon">🔽</span>
            Sort
          </button>
        </div>
      </div>

      <!-- Results Section -->
      <div class="results-section card" v-if="hasValidInputs">
        <div class="section-header">
          <h3>📊 Portfolio Analysis</h3>
          <div class="risk-indicator" :class="riskLevelClass">
            {{ riskLevel }} Risk
          </div>
        </div>
        
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card" v-for="stat in portfolioStats" :key="stat.label">
            <div class="summary-label">{{ stat.label }}</div>
            <div class="summary-value" :class="stat.class">{{ stat.value }}</div>
          </div>
        </div>
        
        <!-- Main Metrics -->
        <div class="metrics-container">
          <div class="metric-row">
            <span class="metric-label">💰 Total Margin:</span>
            <span class="metric-value">{{ formatUSD(totalMarginUsed) }}</span>
          </div>
          
          <div class="metric-row" :class="totalPnlClass">
            <span class="metric-label">📊 Total P&L:</span>
            <span class="metric-value">
              {{ formatUSD(totalPnl) }}
              <span class="percentage">({{ formatPercentage(totalPnlPercentage) }})</span>
            </span>
          </div>
          
          <div class="metric-row">
            <span class="metric-label">💵 Current Equity:</span>
            <span class="metric-value">{{ formatUSD(currentEquity) }}</span>
          </div>
        </div>

        <!-- Liquidation Section -->
        <div class="liquidation-card">
          <div class="liquidation-price">
            <div class="price-label">Portfolio Liquidation Price</div>
            <div class="price-value">{{ formatUSD(portfolioLiquidationPrice) }}</div>
          </div>
          
          <div class="distance-meter">
            <div class="distance-label">
              <span>Distance</span>
              <span :class="distanceClass">{{ formatPercentage(percentageDistance) }}</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :class="distanceClass"
                :style="{ width: Math.min(100 - percentageDistance, 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <transition name="slide">
          <div class="warning-message" v-if="showWarning">
            <span class="warning-icon">⚠️</span>
            <span>{{ warningMessage }}</span>
          </div>
        </transition>

        <!-- Visual Price Scale -->
        <div class="visual-indicator">
          <h4>📏 Price Scale</h4>
          <div class="price-scale-container">
            <div class="markers">
              <div 
                v-for="(pos, index) in positions" 
                :key="'liq-' + index"
                class="marker"
                :class="pos.type"
                :style="{ left: getLiquidationPosition(calculateIndividualLiquidation(pos)) + '%' }"
              >
                <span class="marker-tooltip">P{{ index + 1 }}</span>
              </div>
              <div 
                class="marker current"
                :style="{ left: currentPricePosition + '%' }"
              >
                <span class="marker-tooltip">Now</span>
              </div>
              <div 
                class="marker portfolio"
                :style="{ left: portfolioLiquidationPosition + '%' }"
              >
                <span class="marker-tooltip">Liq</span>
              </div>
            </div>
            
            <div class="scale-bar">
              <div class="scale-fill danger" :style="{ width: getDangerZoneWidth() + '%' }"></div>
              <div class="scale-fill warning" :style="{ width: getWarningZoneWidth() + '%' }"></div>
              <div class="scale-fill safe" :style="{ width: getSafeZoneWidth() + '%' }"></div>
            </div>
            
            <div class="scale-labels">
              <span>{{ formatUSD(minPrice) }}</span>
              <span>{{ formatUSD(currentGoldPrice) }}</span>
              <span>{{ formatUSD(maxPrice) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state card" v-else>
        <div class="empty-icon">📊</div>
        <h3>No Active Positions</h3>
        <p>Add positions to see portfolio analysis</p>
        <div class="empty-actions">
          <button class="action-btn primary" @click="addPosition">
            <span>➕</span> Add First Position
          </button>
          <button class="action-btn secondary" @click="loadFromCache" v-if="hasCachedData">
            <span>📂</span> Load from Cache ({{ cachedRowCount }} rows)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCache } from '../composables/useCache'
import { useNotification } from '../composables/useNotification'

// Initialize cache and notification
const { setCache, getCache, removeCache } = useCache()
const notification = useNotification()

// Cache keys
const CALCULATOR_CACHE_KEY = 'gold_calculator_cache'
const CALCULATOR_TIMESTAMP_KEY = 'gold_calculator_timestamp'
const CACHE_EXPIRY_MINUTES = 60 // Cache expires after 60 minutes

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
  }
})

// State
const currentGoldPrice = ref(props.initialGoldPrice)
const accountBalance = ref(props.initialBalance)
const cacheLoaded = ref(false)
const hasCachedData = ref(false)
const lastCacheTime = ref(null)
const cachedRowCount = ref(0)

// Gold price fetching state
const loading = ref(false)
const error = ref(null)
const connectionState = ref('disconnected')
const connectionMessage = ref('Disconnected')
const lastUpdateTime = ref(null)
const goldData = ref(null)
const goldHistory = ref([])
const goldTimestamps = ref([])

// Positions array - stores ALL rows
const positions = ref([
  {
    type: 'long',
    lots: 0.1,
    entryPrice: 4870.148,
    leverage: 200
  }
])

// Constants
const GOLD_UNIT_PER_LOT = 100 // 1 lot = 100 troy ounces

// ============== GOLD PRICE FETCHING ==============
const fetchGoldPrice = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = null

  try {
    const response = await fetch(GOLD_API_URL)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Store previous price with timestamp
    if (goldData.value) {
      goldHistory.value.push(goldData.value.price)
      goldTimestamps.value.push(new Date())
      
      // Keep only last 30 data points
      if (goldHistory.value.length > 30) {
        goldHistory.value.shift()
        goldTimestamps.value.shift()
      }
    }
    
    goldData.value = data
    currentGoldPrice.value = data.price
    lastUpdateTime.value = new Date().toLocaleTimeString()
    connectionState.value = 'connected'
    connectionMessage.value = 'Connected'
    
    saveToCache() // Auto-save after price update
    notification.success('Gold price updated')
    
  } catch (err) {
    error.value = err.message
    connectionState.value = 'disconnected'
    connectionMessage.value = 'Disconnected'
    notification.error(`Failed to fetch gold: ${err.message}`)
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
    // Create a deep copy of positions to ensure all data is saved
    const positionsCopy = JSON.parse(JSON.stringify(positions.value))
    
    const cacheData = {
      currentGoldPrice: currentGoldPrice.value,
      accountBalance: accountBalance.value,
      positions: positionsCopy, // This saves ALL rows
      timestamp: new Date().toISOString(),
      rowCount: positions.value.length
    }
    
    // Save with expiry
    setCache(CALCULATOR_CACHE_KEY, JSON.stringify(cacheData), CACHE_EXPIRY_MINUTES)
    setCache(CALCULATOR_TIMESTAMP_KEY, new Date().toISOString(), CACHE_EXPIRY_MINUTES)
    
    hasCachedData.value = true
    lastCacheTime.value = new Date().toLocaleTimeString()
    cachedRowCount.value = positions.value.length
    
    notification.success(`Saved ${positions.value.length} position(s) to cache`)
    console.log('💾 Cached positions:', positions.value.length, 'rows', positionsCopy)
    
  } catch (err) {
    console.error('Failed to save to cache:', err)
    notification.error('Failed to save to cache')
  }
}

const loadFromCache = async () => {
  try {
    const cached = getCache(CALCULATOR_CACHE_KEY)
    const timestamp = getCache(CALCULATOR_TIMESTAMP_KEY)
    
    if (cached && timestamp) {
      const cacheData = JSON.parse(cached)
      
      // IMPORTANT: Force a complete re-assignment of the positions array
      // This ensures Vue's reactivity picks up the change
      const loadedPositions = cacheData.positions || []
      
      // Clear existing array first (optional but helps with reactivity)
      positions.value = []
      
      // Use nextTick to ensure DOM updates properly
      await nextTick()
      
      // Set the new positions
      positions.value = loadedPositions.map(pos => ({
        type: pos.type || 'long',
        lots: Number(pos.lots) || 0.1,
        entryPrice: Number(pos.entryPrice) || 0,
        leverage: Number(pos.leverage) || 10
      }))
      
      // Update other values
      currentGoldPrice.value = cacheData.currentGoldPrice || currentGoldPrice.value
      accountBalance.value = cacheData.accountBalance || accountBalance.value
      
      cacheLoaded.value = true
      lastCacheTime.value = new Date(timestamp).toLocaleTimeString()
      cachedRowCount.value = positions.value.length
      
      // Force a recalculation
      calculateAll()
      
      notification.success(`Loaded ${positions.value.length} position(s) from cache (saved at ${lastCacheTime.value})`)
      console.log('📂 Loaded positions:', positions.value.length, 'rows', positions.value)
      
      // Auto-hide cache badge after 3 seconds
      setTimeout(() => {
        cacheLoaded.value = false
      }, 3000)
    } else {
      notification.info('No cached data found')
    }
  } catch (err) {
    console.error('Failed to load from cache:', err)
    notification.error('Failed to load from cache')
  }
}

const clearCache = () => {
  try {
    removeCache(CALCULATOR_CACHE_KEY)
    removeCache(CALCULATOR_TIMESTAMP_KEY)
    hasCachedData.value = false
    lastCacheTime.value = null
    cachedRowCount.value = 0
    notification.success('Cache cleared')
  } catch (err) {
    console.error('Failed to clear cache:', err)
    notification.error('Failed to clear cache')
  }
}

const checkCache = () => {
  try {
    const cached = getCache(CALCULATOR_CACHE_KEY)
    const timestamp = getCache(CALCULATOR_TIMESTAMP_KEY)
    
    hasCachedData.value = !!cached
    
    if (timestamp) {
      lastCacheTime.value = new Date(timestamp).toLocaleTimeString()
    }
    
    if (cached) {
      const cacheData = JSON.parse(cached)
      cachedRowCount.value = cacheData.rowCount || cacheData.positions?.length || 0
      console.log('📦 Cache check:', cachedRowCount.value, 'rows available')
    }
  } catch (err) {
    console.error('Failed to check cache:', err)
    hasCachedData.value = false
  }
}

// ============== INPUT HANDLING ==============
const handleInput = () => {
  calculateAll()
  saveToCache() // Auto-save on any input change
}

const handlePositionChange = () => {
  calculateAll()
  saveToCache() // Auto-save on position changes
}

// ============== POSITION MANAGEMENT ==============
const addPosition = () => {
  positions.value.push({
    type: 'long',
    lots: 0.1,
    entryPrice: currentGoldPrice.value,
    leverage: 10
  })
  handlePositionChange()
  notification.info(`Added position #${positions.value.length}`)
}

const removePosition = (index) => {
  const removed = positions.value[index]
  positions.value.splice(index, 1)
  handlePositionChange()
  notification.info(`Removed position #${index + 1} (${removed.lots} lots)`)
}

const duplicateLastPosition = () => {
  if (positions.value.length > 0) {
    const lastPos = positions.value[positions.value.length - 1]
    positions.value.push({
      ...lastPos,
      lots: lastPos.lots // Copy same lots
    })
    handlePositionChange()
    notification.info(`Duplicated position #${positions.value.length - 1}`)
  }
}

const sortPositions = () => {
  // Sort by entry price (descending)
  positions.value.sort((a, b) => b.entryPrice - a.entryPrice)
  handlePositionChange()
  notification.info('Positions sorted by entry price')
}

const resetToExample = () => {
  currentGoldPrice.value = 4870.148
  accountBalance.value = 10000
  positions.value = [
    {
      type: 'long',
      lots: 0.1,
      entryPrice: 4870.148,
      leverage: 200
    },
    {
      type: 'short',
      lots: 0.05,
      entryPrice: 4880.000,
      leverage: 100
    },
    {
      type: 'long',
      lots: 0.2,
      entryPrice: 4860.500,
      leverage: 50
    }
  ]
  handleInput()
  notification.info(`Loaded example with ${positions.value.length} positions`)
}

const clearAll = () => {
  currentGoldPrice.value = 0
  accountBalance.value = 0
  positions.value = []
  handleInput()
  notification.info('All positions cleared')
}

// ============== COMPUTED PROPERTIES ==============
const totalLots = computed(() => {
  return positions.value.reduce((sum, pos) => sum + Number(pos.lots), 0)
})

const totalPositionValue = computed(() => {
  return positions.value.reduce((sum, pos) => {
    return sum + (pos.lots * GOLD_UNIT_PER_LOT * pos.entryPrice)
  }, 0)
})

const totalMarginUsed = computed(() => {
  return positions.value.reduce((sum, pos) => {
    const positionValue = pos.lots * GOLD_UNIT_PER_LOT * pos.entryPrice
    return sum + (positionValue / pos.leverage)
  }, 0)
})

// Portfolio Stats
const portfolioStats = computed(() => [
  {
    label: 'Positions',
    value: positions.value.length,
    class: ''
  },
  {
    label: 'Volume',
    value: totalLots.value.toFixed(2) + 'L',
    class: ''
  },
  {
    label: 'Exposure',
    value: formatUSD(totalPositionValue.value),
    class: ''
  }
])

// Calculate P&L for each position
const calculatePositionPnl = (position) => {
  const priceDiff = currentGoldPrice.value - position.entryPrice
  const rawPnl = position.lots * GOLD_UNIT_PER_LOT * priceDiff
  return position.type === 'long' ? rawPnl : -rawPnl
}

const calculatePositionPnlPercentage = (position) => {
  const positionValue = position.lots * GOLD_UNIT_PER_LOT * position.entryPrice
  const marginUsed = positionValue / position.leverage
  const pnl = calculatePositionPnl(position)
  return marginUsed ? (pnl / marginUsed) * 100 : 0
}

// Total P&L
const totalPnl = computed(() => {
  return positions.value.reduce((sum, pos) => {
    return sum + calculatePositionPnl(pos)
  }, 0)
})

const totalPnlPercentage = computed(() => {
  return totalMarginUsed.value ? (totalPnl.value / totalMarginUsed.value) * 100 : 0
})

const currentEquity = computed(() => {
  return accountBalance.value + totalPnl.value
})

// Calculate individual liquidation prices
const calculateIndividualLiquidation = (position) => {
  const positionValue = position.lots * GOLD_UNIT_PER_LOT * position.entryPrice
  const marginUsed = positionValue / position.leverage
  const maintenanceMargin = positionValue * 0.005 // 0.5% maintenance margin
  
  const maxLoss = marginUsed - maintenanceMargin
  const priceMove = maxLoss / (position.lots * GOLD_UNIT_PER_LOT)
  
  if (position.type === 'long') {
    return position.entryPrice - priceMove
  } else {
    return position.entryPrice + priceMove
  }
}

// Portfolio liquidation price
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
         positions.value.length > 0 &&
         positions.value.every(p => p.lots > 0 && p.entryPrice > 0 && p.leverage > 0)
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

// Visual scale
const minPrice = computed(() => {
  const prices = [
    currentGoldPrice.value * 0.7,
    ...positions.value.map(p => calculateIndividualLiquidation(p) * 0.9),
    portfolioLiquidationPrice.value * 0.9
  ]
  return Math.min(...prices.filter(p => p > 0))
})

const maxPrice = computed(() => {
  const prices = [
    currentGoldPrice.value * 1.3,
    ...positions.value.map(p => calculateIndividualLiquidation(p) * 1.1),
    portfolioLiquidationPrice.value * 1.1
  ]
  return Math.max(...prices.filter(p => p > 0))
})

const currentPricePosition = computed(() => {
  const range = maxPrice.value - minPrice.value
  return range ? ((currentGoldPrice.value - minPrice.value) / range) * 100 : 50
})

const portfolioLiquidationPosition = computed(() => {
  const range = maxPrice.value - minPrice.value
  return range ? ((portfolioLiquidationPrice.value - minPrice.value) / range) * 100 : 50
})

const getLiquidationPosition = (price) => {
  const range = maxPrice.value - minPrice.value
  return range ? ((price - minPrice.value) / range) * 100 : 50
}

const getDangerZoneWidth = () => {
  const liqPos = portfolioLiquidationPosition.value
  return Math.min(liqPos, 100)
}

const getWarningZoneWidth = () => {
  const currentPos = currentPricePosition.value
  const liqPos = portfolioLiquidationPosition.value
  const warningZone = Math.min(15, Math.abs(currentPos - liqPos) / 2)
  return currentPos > liqPos ? warningZone : 0
}

const getSafeZoneWidth = () => {
  const currentPos = currentPricePosition.value
  return 100 - currentPos
}

// Methods
const calculateAll = () => {
  // This triggers reactivity
}

const formatUSD = (value) => {
  if (isNaN(value) || !isFinite(value)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(value)
}

const formatPercentage = (value) => {
  if (isNaN(value) || !isFinite(value)) return '0.00%'
  return value.toFixed(2) + '%'
}

// Watch for changes and auto-save
watch([currentGoldPrice, accountBalance, positions], () => {
  calculateAll()
}, { deep: true })

// Lifecycle
onMounted(() => {
  checkCache()
  calculateAll()
  startPricePolling()
})

onUnmounted(() => {
  stopPricePolling()
})
</script>

<style scoped>
/* Modern CSS Reset */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Base Styles */
.gold-calculator {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(145deg, #1a1f2e 0%, #1e2436 100%);
  min-height: 100vh;
  font-size: 14px;
}

.calculator-header {
  margin-bottom: 20px;
  padding: 14px;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

h2 {
  color: white;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

/* Connection Status */
.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 30px;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.1);
}

.connection-status.connected {
  color: #4CAF50;
}

.connection-status.disconnected {
  color: #f44336;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.connected .status-dot {
  background: #4CAF50;
  box-shadow: 0 0 8px #4CAF50;
}

.last-update {
  color: #a0a8c0;
  font-size: 0.8rem;
  margin-left: 4px;
}

/* Cache Status */
.cache-status {
  display: inline-block;
}

.cache-badge {
  background: #4CAF50;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

.cache-info {
  color: #a0a8c0;
  font-size: 0.8rem;
}

.cache-time {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.calculator-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Card Styles */
.card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e2436;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-count {
  font-size: 0.9rem;
  color: #718096;
  font-weight: normal;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: #f0f0f0;
  color: #4a5568;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #667eea;
  color: white;
  transform: scale(1.05);
}

/* Input Styles */
.account-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 0;
}

label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4a5568;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 6px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 10px;
  color: #667eea;
  font-weight: 600;
  font-size: 1rem;
  z-index: 1;
}

.input-suffix {
  position: absolute;
  right: 10px;
  color: #667eea;
  font-weight: 600;
  font-size: 1rem;
}

input {
  width: 100%;
  padding: 10px 14px;
  padding-left: 24px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.refresh-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #667eea;
  padding: 4px 6px;
  border-radius: 6px;
}

.refresh-btn.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Table Styles */
.positions-table-container {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.positions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.positions-table th {
  background: #f7fafc;
  padding: 12px 6px;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.positions-table td {
  padding: 10px 6px;
  border-bottom: 1px solid #e2e8f0;
}

.positions-table tr.long td {
  border-left: 3px solid #4CAF50;
}

.positions-table tr.short td {
  border-left: 3px solid #f44336;
}

.position-number {
  font-weight: 600;
  color: #667eea;
  text-align: center;
}

.type-select {
  width: 90px;
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
}

.type-select.long {
  color: #4CAF50;
  font-weight: 600;
}

.type-select.short {
  color: #f44336;
  font-weight: 600;
}

.table-input {
  width: 80px;
  padding: 6px;
  padding-left: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.85rem;
}

.table-input.leverage {
  padding-left: 6px;
  width: 60px;
}

.input-wrapper.table .input-prefix {
  left: 4px;
  font-size: 0.8rem;
}

.input-wrapper.table .input-suffix {
  right: 4px;
  font-size: 0.8rem;
}

.pnl-cell {
  font-weight: 600;
  font-size: 0.9rem;
  text-align: right;
  padding-right: 10px;
}

.pnl-percent-cell {
  font-size: 0.85rem;
  text-align: right;
  padding-right: 10px;
}

.pnl-cell.positive, .pnl-percent-cell.positive {
  color: #4CAF50;
}

.pnl-cell.negative, .pnl-percent-cell.negative {
  color: #f44336;
}

.liq-cell {
  color: #ff9800;
  font-size: 0.85rem;
  text-align: right;
  padding-right: 10px;
}

.remove-btn.small {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: #f0f0f0;
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn.small:hover {
  background: #f44336;
  color: white;
}

/* Action Buttons */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.action-btn {
  padding: 10px 8px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.9rem;
}

.action-btn.primary {
  background: #667eea;
  color: white;
}

.action-btn.secondary {
  background: #f0f0f0;
  color: #4a5568;
  border: 2px solid transparent;
}

.action-btn.primary:hover {
  background: #5a67d8;
}

.action-btn.secondary:hover {
  background: #e2e8f0;
}

.add-position-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Results Section */
.results-section {
  background: rgba(255, 255, 255, 0.98);
}

.risk-indicator {
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.risk-indicator.critical {
  background: #f44336;
  color: white;
}

.risk-indicator.high {
  background: #ff9800;
  color: white;
}

.risk-indicator.medium {
  background: #ffeb3b;
  color: #333;
}

.risk-indicator.low {
  background: #4CAF50;
  color: white;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card {
  background: linear-gradient(145deg, #667eea, #764ba2);
  color: white;
  padding: 14px;
  border-radius: 16px;
  text-align: center;
}

.summary-label {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 1.2rem;
  font-weight: 700;
}

/* Metrics Container */
.metrics-container {
  background: #f7fafc;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 1rem;
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-row.positive {
  color: #4CAF50;
}

.metric-row.negative {
  color: #f44336;
}

.metric-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4a5568;
}

.metric-value {
  font-weight: 600;
  color: #1e2436;
}

.percentage {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-left: 6px;
}

/* Liquidation Card */
.liquidation-card {
  background: linear-gradient(145deg, #1a1f2e, #2d3748);
  color: white;
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 18px;
}

.liquidation-price {
  text-align: center;
  margin-bottom: 16px;
}

.price-label {
  font-size: 0.85rem;
  color: #a0a8c0;
  margin-bottom: 4px;
}

.price-value {
  font-size: 2rem;
  font-weight: 700;
  color: #ff9800;
}

.distance-meter {
  margin: 14px 0;
}

.distance-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
}

.progress-fill.danger {
  background: #f44336;
}

.progress-fill.warning {
  background: #ff9800;
}

.progress-fill.safe {
  background: #4CAF50;
}

/* Warning Message */
.warning-message {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.warning-icon {
  font-size: 1.4rem;
}

/* Visual Indicator */
.visual-indicator {
  background: #f7fafc;
  border-radius: 16px;
  padding: 18px;
}

.visual-indicator h4 {
  color: #1e2436;
  margin-bottom: 16px;
  font-size: 1.1rem;
}

.price-scale-container {
  position: relative;
  padding: 20px 0;
}

.markers {
  position: relative;
  height: 35px;
  margin-bottom: 12px;
}

.marker {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translateX(-50%);
}

.marker.long {
  background: #4CAF50;
  border: 2px solid white;
}

.marker.short {
  background: #f44336;
  border: 2px solid white;
}

.marker.current {
  background: #2196F3;
  border: 2px solid white;
  width: 16px;
  height: 16px;
  z-index: 3;
}

.marker.portfolio {
  background: #9c27b0;
  border: 2px solid white;
  width: 16px;
  height: 16px;
  z-index: 2;
}

.marker-tooltip {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  pointer-events: none;
}

.scale-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin: 12px 0;
}

.scale-fill {
  height: 100%;
}

.scale-fill.danger {
  background: #f44336;
}

.scale-fill.warning {
  background: #ff9800;
}

.scale-fill.safe {
  background: #4CAF50;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #718096;
  margin-top: 8px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 50px 30px;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  color: #1e2436;
  margin-bottom: 12px;
  font-size: 1.5rem;
}

.empty-state p {
  color: #718096;
  margin-bottom: 24px;
  font-size: 1rem;
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .calculator-grid {
    grid-template-columns: 1fr;
  }
  
  .account-summary {
    grid-template-columns: 1fr;
  }
  
  .positions-table {
    font-size: 0.8rem;
  }
  
  .table-input {
    width: 70px;
  }
  
  .type-select {
    width: 80px;
  }
  
  .price-value {
    font-size: 1.6rem;
  }
  
  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .gold-calculator {
    padding: 12px;
  }
  
  .card {
    padding: 16px;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .positions-table {
    font-size: 0.7rem;
  }
  
  .table-input {
    width: 60px;
    padding: 4px;
  }
  
  .type-select {
    width: 70px;
    font-size: 0.7rem;
  }
  
  .marker-tooltip {
    display: none;
  }
  
  .empty-actions {
    flex-direction: column;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .card {
    background: rgba(30, 35, 48, 0.98);
  }
  
  h3, h4, .label, .metric-label {
    color: #e2e8f0;
  }
  
  input, select {
    background: #2d3748;
    border-color: #4a5568;
    color: white;
  }
  
  .positions-table th {
    background: #1e2436;
    color: #e2e8f0;
  }
  
  .positions-table td {
    border-color: #4a5568;
  }
  
  .metrics-container,
  .visual-indicator {
    background: #1e2436;
  }
  
  .metric-label {
    color: #a0a8c0;
  }
  
  .metric-value {
    color: #e2e8f0;
  }
  
  .empty-state h3 {
    color: #e2e8f0;
  }
}
</style>