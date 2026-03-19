<template>
  <div class="gold-calculator">
    <h2>Gold Trading Portfolio Calculator</h2>
    
    <div class="calculator-grid">
      <!-- Input Section -->
      <div class="input-section">
        <h3>Account Overview</h3>
        
        <div class="input-group">
          <label>
            <span class="label-icon">💰</span>
            Current Gold Price (USD)
          </label>
          <input 
            type="number" 
            v-model="currentGoldPrice" 
            @input="calculateAll"
            placeholder="Enter current gold price"
            inputmode="numeric"
          />
        </div>

        <div class="input-group">
          <label>
            <span class="label-icon">💳</span>
            Account Balance (USDC)
          </label>
          <input 
            type="number" 
            v-model="accountBalance" 
            @input="calculateAll"
            placeholder="Enter your balance"
            inputmode="numeric"
          />
        </div>

        <h3>Open Positions</h3>
        
        <!-- Position List -->
        <div class="positions-container">
          <div v-for="(position, index) in positions" :key="index" class="position-card">
            <div class="position-header">
              <span class="position-title">Position #{{ index + 1 }}</span>
              <button class="remove-btn" @click="removePosition(index)" v-if="positions.length > 1">
                ✕
              </button>
            </div>
            
            <div class="position-details">
              <div class="input-row">
                <div class="input-group half">
                  <label>Type</label>
                  <select v-model="position.type" @change="calculateAll">
                    <option value="long">Long 📈</option>
                    <option value="short">Short 📉</option>
                  </select>
                </div>
                
                <div class="input-group half">
                  <label>Lots</label>
                  <input 
                    type="number" 
                    v-model="position.lots" 
                    @input="calculateAll"
                    step="0.01"
                    min="0"
                    inputmode="decimal"
                  />
                </div>
              </div>
              
              <div class="input-row">
                <div class="input-group half">
                  <label>Entry Price</label>
                  <input 
                    type="number" 
                    v-model="position.entryPrice" 
                    @input="calculateAll"
                    inputmode="numeric"
                  />
                </div>
                
                <div class="input-group half">
                  <label>Leverage</label>
                  <input 
                    type="number" 
                    v-model="position.leverage" 
                    @input="calculateAll"
                    min="1"
                    inputmode="numeric"
                  />
                </div>
              </div>
              
              <!-- Individual Position P&L -->
              <div class="position-pnl" :class="getPnlClass(position)">
                <span>P&L: {{ formatUSD(calculatePositionPnl(position)) }}</span>
                <span class="pnl-percentage">
                  ({{ formatPercentage(calculatePositionPnlPercentage(position)) }})
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Position Actions -->
        <div class="position-actions">
          <button class="action-btn" @click="addPosition">
            <span class="btn-icon">➕</span>
            Add Position
          </button>
          <button class="action-btn" @click="resetToExample">
            <span class="btn-icon">📋</span>
            Load Example
          </button>
        </div>
      </div>

      <!-- Results Section -->
      <div class="results-section" v-if="hasValidInputs">
        <h3>Portfolio Analysis</h3>
        
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-label">Total Positions</div>
            <div class="summary-value">{{ positions.length }}</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Total Volume</div>
            <div class="summary-value">{{ totalLots.toFixed(2) }} Lots</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Total Exposure</div>
            <div class="summary-value">{{ formatUSD(totalPositionValue) }}</div>
          </div>
        </div>
        
        <div class="result-card">
          <div class="result-item highlight">
            <span class="label">
              <span class="label-icon">💰</span>
              Total Margin Used:
            </span>
            <span class="value">{{ formatUSD(totalMarginUsed) }}</span>
          </div>
          
          <div class="result-item highlight-pnl">
            <span class="label">
              <span class="label-icon">📊</span>
              Total P&L:
            </span>
            <span class="value" :class="totalPnlClass">
              {{ formatUSD(totalPnl) }}
              <span class="percentage">({{ formatPercentage(totalPnlPercentage) }})</span>
            </span>
          </div>
          
          <div class="result-item">
            <span class="label">
              <span class="label-icon">💵</span>
              Current Equity:
            </span>
            <span class="value">{{ formatUSD(currentEquity) }}</span>
          </div>
          
          <div class="result-item highlight">
            <span class="label">
              <span class="label-icon">⚠️</span>
              Portfolio Liquidation Price:
            </span>
            <span class="value liquidation">{{ formatUSD(portfolioLiquidationPrice) }}</span>
          </div>
          
          <div class="result-item">
            <span class="label">
              <span class="label-icon">📏</span>
              Distance to Liquidation:
            </span>
            <span class="value" :class="distanceClass">
              {{ formatUSD(priceDistance) }}
              <span class="percentage">({{ formatPercentage(percentageDistance) }})</span>
            </span>
          </div>
          
          <div class="result-item">
            <span class="label">
              <span class="label-icon">📉</span>
              Max Loss Before Liquidation:
            </span>
            <span class="value">{{ formatUSD(maxLossBeforeLiquidation) }}</span>
          </div>
        </div>

        <!-- Position Breakdown -->
        <div class="position-breakdown">
          <h4>Position Breakdown</h4>
          <div class="breakdown-list">
            <div v-for="(position, index) in positions" :key="index" class="breakdown-item">
              <div class="breakdown-header">
                <span>Position #{{ index + 1 }} ({{ position.type }})</span>
                <span :class="getPnlClass(position)">
                  {{ formatUSD(calculatePositionPnl(position)) }}
                </span>
              </div>
              <div class="breakdown-details">
                <span>{{ position.lots }} lots @ {{ formatUSD(position.entryPrice) }}</span>
                <span>Liq: {{ formatUSD(calculateIndividualLiquidation(position)) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Meter -->
        <div class="risk-meter">
          <div class="meter-label">
            <span>Risk Level</span>
            <span :class="riskLevelClass">{{ riskLevel }}</span>
          </div>
          <div class="meter-bar">
            <div 
              class="meter-fill" 
              :class="riskLevelClass"
              :style="{ width: riskPercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="warning-message" v-if="showWarning">
          <span class="warning-icon">⚠️</span>
          <span>{{ warningMessage }}</span>
        </div>

        <!-- Visual Price Scale -->
        <div class="visual-indicator">
          <h4>Price Scale</h4>
          <div class="price-scale">
            <div class="scale-bar">
              <div 
                v-for="(pos, index) in positions" 
                :key="'liq-' + index"
                class="individual-liquidation-marker"
                :class="pos.type"
                :style="{ left: getLiquidationPosition(calculateIndividualLiquidation(pos)) + '%' }"
              >
                <span class="marker-label">P{{ index + 1 }}</span>
              </div>
              <div 
                class="current-price-marker" 
                :style="{ left: currentPricePosition + '%' }"
              >
                <span class="marker-label">Current</span>
              </div>
              <div 
                class="portfolio-liquidation-marker" 
                :style="{ left: portfolioLiquidationPosition + '%' }"
              >
                <span class="marker-label">Portfolio Liq</span>
              </div>
            </div>
            <div class="scale-labels">
              <span>{{ formatCompactUSD(minPrice) }}</span>
              <span>{{ formatCompactUSD(currentGoldPrice) }}</span>
              <span>{{ formatCompactUSD(maxPrice) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  initialGoldPrice: {
    type: Number,
    default: 4780
  },
  initialBalance: {
    type: Number,
    default: 50000
  }
})

// State
const currentGoldPrice = ref(props.initialGoldPrice)
const accountBalance = ref(props.initialBalance)

// Positions array
const positions = ref([
  {
    type: 'long',
    lots: 1,
    entryPrice: 4880,
    leverage: 10
  },
  {
    type: 'long',
    lots: 1,
    entryPrice: 4800,
    leverage: 10
  }
])

// Constants
const GOLD_UNIT_PER_LOT = 100
const MAINTENANCE_MARGIN_RATE = 0.005 // 0.5%

// Computed properties
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
  const maintenanceMargin = positionValue * MAINTENANCE_MARGIN_RATE
  
  // For isolated liquidation (treating each position separately)
  const maxLoss = marginUsed - maintenanceMargin
  
  if (position.type === 'long') {
    return position.entryPrice - (maxLoss / (position.lots * GOLD_UNIT_PER_LOT))
  } else {
    return position.entryPrice + (maxLoss / (position.lots * GOLD_UNIT_PER_LOT))
  }
}

// Portfolio liquidation price (cross-margin)
const portfolioLiquidationPrice = computed(() => {
  if (totalMarginUsed.value <= 0 || currentEquity.value <= 0) return 0
  
  // Calculate weighted average exposure
  let totalDelta = 0
  let totalSize = 0
  
  positions.value.forEach(pos => {
    const size = pos.lots * GOLD_UNIT_PER_LOT
    totalSize += size
    if (pos.type === 'long') {
      totalDelta += size
    } else {
      totalDelta -= size
    }
  })
  
  if (totalDelta === 0) return currentGoldPrice.value // Hedged position
  
  // Calculate price change needed to liquidate entire portfolio
  const maintenanceMargin = totalPositionValue.value * MAINTENANCE_MARGIN_RATE
  const maxLoss = currentEquity.value - maintenanceMargin
  
  // Direction of liquidation price based on net position
  if (totalDelta > 0) {
    // Net long
    return currentGoldPrice.value - (maxLoss / totalDelta)
  } else {
    // Net short
    return currentGoldPrice.value + (maxLoss / Math.abs(totalDelta))
  }
})

const priceDistance = computed(() => {
  return Math.abs(currentGoldPrice.value - portfolioLiquidationPrice.value)
})

const percentageDistance = computed(() => {
  return currentGoldPrice.value ? (priceDistance.value / currentGoldPrice.value) * 100 : 0
})

const maxLossBeforeLiquidation = computed(() => {
  return Math.abs(priceDistance.value * Math.abs(totalDelta))
})

const totalDelta = computed(() => {
  return positions.value.reduce((sum, pos) => {
    const size = pos.lots * GOLD_UNIT_PER_LOT
    return sum + (pos.type === 'long' ? size : -size)
  }, 0)
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

const riskPercentage = computed(() => {
  return Math.min(Math.abs(totalPnl.value) / accountBalance.value * 100, 100)
})

const showWarning = computed(() => {
  return percentageDistance.value < 5 || Math.abs(totalPnl.value) > accountBalance.value * 0.5
})

const warningMessage = computed(() => {
  if (Math.abs(totalPnl.value) > accountBalance.value * 0.5) {
    return 'High drawdown - Portfolio at risk'
  }
  if (percentageDistance.value < 3) {
    return 'Very close to portfolio liquidation!'
  }
  if (percentageDistance.value < 5) {
    return 'Approaching liquidation - Monitor closely'
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

// Methods
const calculateAll = () => {
  // Triggered by reactivity
}

const addPosition = () => {
  positions.value.push({
    type: 'long',
    lots: 0.1,
    entryPrice: currentGoldPrice.value,
    leverage: 10
  })
}

const removePosition = (index) => {
  positions.value.splice(index, 1)
}

const resetToExample = () => {
  currentGoldPrice.value = 4780
  accountBalance.value = 50000
  positions.value = [
    {
      type: 'long',
      lots: 1,
      entryPrice: 4880,
      leverage: 10
    },
    {
      type: 'long',
      lots: 1,
      entryPrice: 4800,
      leverage: 10
    }
  ]
}

const formatUSD = (value) => {
  if (isNaN(value) || !isFinite(value)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatCompactUSD = (value) => {
  if (isNaN(value) || !isFinite(value)) return '$0'
  if (Math.abs(value) >= 1e6) {
    return '$' + (value / 1e6).toFixed(1) + 'M'
  }
  if (Math.abs(value) >= 1e3) {
    return '$' + (value / 1e3).toFixed(1) + 'K'
  }
  return '$' + value.toFixed(0)
}

const formatPercentage = (value) => {
  if (isNaN(value) || !isFinite(value)) return '0.00%'
  return value.toFixed(2) + '%'
}
</script>

<style scoped>
/* Base Styles */
.gold-calculator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

h2 {
  margin: 0 0 20px 0;
  color: white;
  text-align: center;
  font-size: clamp(1.5rem, 5vw, 2rem);
}

.calculator-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Input Section */
.input-section {
  background: rgba(255, 255, 255, 0.95);
  padding: clamp(15px, 4vw, 25px);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  backdrop-filter: blur(10px);
}

h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: clamp(1.1rem, 4vw, 1.3rem);
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

h4 {
  margin: 0 0 10px 0;
  color: #555;
  font-size: 1rem;
}

.input-group {
  margin-bottom: 15px;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
}

.half {
  margin-bottom: 0;
}

.label-icon {
  margin-right: 5px;
  font-size: 1.1em;
}

label {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  color: #555;
  font-size: 0.9em;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1em;
  box-sizing: border-box;
  transition: all 0.3s ease;
  background: white;
  -webkit-appearance: none;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Position Type Buttons */
.position-type {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 20px 0;
}

.position-btn {
  padding: 15px;
  border: none;
  border-radius: 10px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f0f0f0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.position-btn.active {
  background: #667eea;
  color: white;
  transform: scale(1.02);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 1.2em;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 15px;
}

.quick-btn {
  padding: 12px;
  border: 2px solid #667eea;
  border-radius: 10px;
  background: transparent;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9em;
}

.quick-btn:hover {
  background: #667eea;
  color: white;
}

/* Results Section */
.results-section {
  background: rgba(255, 255, 255, 0.95);
  padding: clamp(15px, 4vw, 25px);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  backdrop-filter: blur(10px);
}

.result-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 10px;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.highlight {
  background: #e3f2fd;
  margin: 5px -15px;
  padding: 15px;
  border-radius: 8px;
  font-weight: bold;
}

.result-item.highlight-pnl {
  background: #f5f5f5;
  margin: 5px -15px;
  padding: 15px;
  border-radius: 8px;
}

.label {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 0.95em;
}

.value {
  font-weight: 600;
  color: #333;
  text-align: right;
}

.percentage {
  font-size: 0.8em;
  margin-left: 5px;
  opacity: 0.8;
  display: inline-block;
}

.value.positive {
  color: #4CAF50;
}

.value.negative {
  color: #f44336;
}

.value.liquidation {
  color: #ff9800;
  font-size: 1.1em;
}

/* Margin Meter */
.margin-meter {
  margin-top: 15px;
  padding: 10px 0;
}

.meter-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.9em;
  color: #666;
}

.meter-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.meter-fill.safe {
  background: #4CAF50;
}

.meter-fill.warning {
  background: #ff9800;
}

.meter-fill.danger {
  background: #f44336;
}

/* Warning Message */
.warning-message {
  margin-top: 15px;
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  color: #856404;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95em;
}

.warning-icon {
  font-size: 1.2em;
}

/* Visual Indicator */
.visual-indicator {
  margin-top: 20px;
}

.price-scale {
  margin-top: 20px;
}

.scale-bar {
  position: relative;
  height: 6px;
  background: linear-gradient(to right, #f44336, #ffeb3b, #4CAF50);
  border-radius: 3px;
  margin: 20px 0;
}

.current-price-marker,
.liquidation-marker {
  position: absolute;
  bottom: 15px;
  transform: translateX(-50%);
  cursor: pointer;
}

.current-price-marker {
  width: 16px;
  height: 16px;
  background: #2196F3;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.liquidation-marker {
  width: 16px;
  height: 16px;
  background: #f44336;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.marker-label {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.current-price-marker:hover .marker-label,
.liquidation-marker:hover .marker-label {
  opacity: 1;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: #666;
  margin-top: 5px;
}

.min-price,
.max-price {
  color: #999;
}

.current-price {
  color: #2196F3;
  font-weight: 600;
}

/* Risk Badge */
.risk-badge {
  margin-top: 20px;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 600;
  animation: pulse 2s infinite;
}

.risk-badge.critical {
  background: #f44336;
  color: white;
}

.risk-badge.high {
  background: #ff9800;
  color: white;
}

.risk-badge.medium {
  background: #ffeb3b;
  color: #333;
}

.risk-badge.low {
  background: #4CAF50;
  color: white;
}

.risk-icon {
  font-size: 1.3em;
}

/* Empty State */
.empty-state {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px 20px;
  border-radius: 15px;
  text-align: center;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  color: #666;
  font-size: 1.1em;
  margin: 0;
}

/* Animations */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .gold-calculator {
    padding: 10px;
    border-radius: 15px;
  }

  .calculator-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .input-section,
  .results-section {
    padding: 15px;
  }

  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .value {
    width: 100%;
    text-align: left;
  }

  .percentage {
    display: block;
    margin-left: 0;
    margin-top: 2px;
  }

  .marker-label {
    display: none;
  }

  .risk-badge {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .input-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .position-btn {
    padding: 12px;
    font-size: 1em;
  }

  .result-item.highlight,
  .result-item.highlight-pnl {
    margin: 5px -10px;
    padding: 12px;
  }

  .scale-labels {
    font-size: 0.7em;
  }

  .warning-message {
    flex-direction: column;
    text-align: center;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  input {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  .position-btn,
  .quick-btn {
    min-height: 48px; /* Better touch target */
  }

  .current-price-marker,
  .liquidation-marker {
    width: 20px;
    height: 20px;
  }
}

/* Landscape Mode */
@media (max-height: 600px) and (orientation: landscape) {
  .gold-calculator {
    padding: 10px;
  }

  .calculator-grid {
    grid-template-columns: 1fr 1fr;
  }

  .input-section,
  .results-section {
    max-height: 90vh;
    overflow-y: auto;
  }
}

/* High-resolution Screens */
@media (min-width: 1440px) {
  .gold-calculator {
    max-width: 1400px;
  }

  .input-section,
  .results-section {
    padding: 30px;
  }

  input {
    padding: 15px 20px;
    font-size: 1.1em;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .gold-calculator {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }

  .input-section,
  .results-section {
    background: rgba(30, 30, 46, 0.95);
  }

  h3 {
    color: #fff;
    border-bottom-color: #4a4a6a;
  }

  label {
    color: #ccc;
  }

  input {
    background: #2a2a3a;
    border-color: #3a3a4a;
    color: #fff;
  }

  input:focus {
    border-color: #667eea;
  }

  .result-card {
    background: #2a2a3a;
  }

  .label {
    color: #aaa;
  }

  .value {
    color: #fff;
  }

  .result-item.highlight {
    background: #1e1e2e;
  }

  .result-item.highlight-pnl {
    background: #252535;
  }

  .empty-state {
    background: rgba(30, 30, 46, 0.95);
  }

  .empty-state p {
    color: #aaa;
  }
}

/* Print Styles */
@media print {
  .gold-calculator {
    background: white;
    box-shadow: none;
  }

  .input-section,
  .results-section {
    background: white;
    box-shadow: none;
    border: 1px solid #ddd;
  }

  .quick-actions,
  .position-btn,
  .risk-badge {
    display: none;
  }
}
.positions-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
  margin-bottom: 15px;
}

.position-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.position-card:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.position-title {
  font-weight: 600;
  color: #333;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.2em;
  cursor: pointer;
  padding: 0 5px;
  transition: color 0.3s ease;
}

.remove-btn:hover {
  color: #f44336;
}

select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  background: white;
  cursor: pointer;
}

.position-pnl {
  margin-top: 10px;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 0.9em;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.position-pnl.positive {
  background: #e8f5e8;
  color: #4CAF50;
}

.position-pnl.negative {
  background: #ffebee;
  color: #f44336;
}

.pnl-percentage {
  font-size: 0.85em;
  opacity: 0.8;
}

.position-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 15px;
}

.action-btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #667eea;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.action-btn:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
}

.summary-label {
  font-size: 0.8em;
  opacity: 0.9;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 1.1em;
  font-weight: 600;
}

.position-breakdown {
  margin-top: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
}

.breakdown-list {
  margin-top: 10px;
}

.breakdown-item {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-weight: 500;
}

.breakdown-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
  color: #666;
}

.risk-meter {
  margin-top: 20px;
  padding: 10px 0;
}

.meter-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.9em;
  color: #666;
}

.meter-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.meter-fill.critical {
  background: #f44336;
}

.meter-fill.high {
  background: #ff9800;
}

.meter-fill.medium {
  background: #ffeb3b;
}

.meter-fill.low {
  background: #4CAF50;
}

.individual-liquidation-marker {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #ff9800;
  border: 2px solid white;
  border-radius: 50%;
  transform: translateX(-50%);
  bottom: 15px;
}

.individual-liquidation-marker.long {
  background: #2196F3;
}

.individual-liquidation-marker.short {
  background: #f44336;
}

.portfolio-liquidation-marker {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #9c27b0;
  border: 3px solid white;
  border-radius: 50%;
  transform: translateX(-50%);
  bottom: 15px;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.4);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .position-card {
    background: #2a2a3a;
    border-color: #3a3a4a;
  }
  
  .position-title {
    color: #fff;
  }
  
  select {
    background: #2a2a3a;
    border-color: #3a3a4a;
    color: #fff;
  }
  
  .position-pnl {
    background: #353545;
  }
  
  .position-breakdown {
    background: #2a2a3a;
  }
  
  .breakdown-details {
    color: #aaa;
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .position-actions {
    grid-template-columns: 1fr;
  }
  
  .positions-container {
    max-height: 350px;
  }
}
</style>