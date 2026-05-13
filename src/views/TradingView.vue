<!-- <template>
  <div class="tradingview-wrapper">
    <div class="controls-bar">
      <div class="control-group">
        <label>📊 Symbol:</label>
        <select v-model="currentSymbol" @change="changeSymbol">
          <option value="XAUUSD">Gold Spot(XAU/USD)</option>
          <option value="DXY">US Dollar(DXY)</option>
          <option value="XAGUSD">Silver Spot(XAG/USD)</option>
          <option value="AUDUSD">AUD/USD</option>
          <option value="EURUSD">EUR/USD</option>
          <option value="GBPUSD">GBP/USD</option>
          <option value="BTCUSD">Bitcoin (BTC/USD)</option>
          <option value="SPX">📈 S&P 500 (SPX)</option>
        </select>
      </div>

      <div class="control-group">
        <label>⏱️ Interval:</label>
        <select v-model="currentInterval" @change="changeInterval">
          <option value="1">1 Minute</option>
          <option value="5">5 Minutes</option>
          <option value="15">15 Minutes</option>
          <option value="30">30 Minutes</option>
          <option value="60">1 Hour</option>
          <option value="240">4 Hours</option>
          <option value="D">Daily</option>
          <option value="W">Weekly</option>
          <option value="M">Monthly</option>
        </select>
      </div>

      <div class="control-group">
        <label>🎨 Theme:</label>
        <button @click="toggleTheme" class="theme-btn">
          {{ isDarkTheme ? '🌙 Dark' : '☀️ Light' }}
        </button>
      </div>
    </div>

    <div id="tv_chart_container" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// State
const currentSymbol = ref('XAUUSD')
const currentInterval = ref('5') //5min
const isDarkTheme = ref(true)
let tvWidget = null

// Load TradingView script
const loadTradingViewScript = () => {
  return new Promise((resolve, reject) => {
    if (window.TradingView) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load TradingView script'))
    document.head.appendChild(script)
  })
}

// Initialize chart with Phnom Penh timezone (GMT+7)
const initChart = async () => {
  try {
    await loadTradingViewScript()
    
    // Destroy existing widget if any
    if (tvWidget) {
      tvWidget.remove()
      tvWidget = null
    }
    
    // Clear container
    const container = document.getElementById('tv_chart_container')
    if (container) {
      container.innerHTML = ''
    }
    
    // Create new widget with Phnom Penh timezone
    tvWidget = new window.TradingView.widget({
      symbol: currentSymbol.value,
      interval: currentInterval.value,
      timezone: 'Asia/Phnom_Penh',  // 👈 Phnom Penh GMT+7
      theme: isDarkTheme.value ? 'dark' : 'light',
      style: '1',  // Candlestick style
      locale: 'en',
      toolbar_bg: isDarkTheme.value ? '#131722' : '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      studies: ['MASimple@tv-basicstudies'],  // Moving Average
      container_id: 'tv_chart_container',
      height: '100%',
      width: '100%',
      autosize: true,
      save_load_adapter: {
        save: function() {},
        load: function() {}
      },
      loading_screen: { backgroundColor: isDarkTheme.value ? '#131722' : '#ffffff' }
    })
    
    // Wait for widget to be ready
    tvWidget.onChartReady(() => {
      console.log('Chart ready with timezone:', tvWidget.options().timezone)
    })
    
  } catch (error) {
    console.error('Error initializing chart:', error)
  }
}

// Change symbol without recreating widget
const changeSymbol = () => {
  if (tvWidget && tvWidget.setSymbol) {
    tvWidget.setSymbol(currentSymbol.value, currentInterval.value, () => {
      console.log(`Symbol changed to: ${currentSymbol.value}`)
    })
  } else {
    // Fallback: recreate widget
    initChart()
  }
}

// Change interval
const changeInterval = () => {
  if (tvWidget && tvWidget.setInterval) {
    tvWidget.setInterval(currentInterval.value)
  } else {
    initChart()
  }
}

// Toggle theme
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  initChart()  // Recreate with new theme
}

// Lifecycle hooks
onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  if (tvWidget) {
    tvWidget.remove()
    tvWidget = null
  }
})
</script>

<style scoped>
.tradingview-wrapper {
  height: 700px;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.controls-bar {
  display: flex;
  gap: 20px;
  padding: 12px 20px;
  background-color: #1e1e2e;
  border-bottom: 1px solid #3a3a4a;
  flex-wrap: wrap;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-group label {
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
}

.control-group select {
  padding: 8px 12px;
  background-color: #2d2d2d;
  color: #e0e0e0;
  border: 1px solid #3a3a4a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.control-group select:hover {
  border-color: #2962ff;
  background-color: #353545;
}

.theme-btn {
  padding: 8px 16px;
  background-color: #2d2d2d;
  color: #e0e0e0;
  border: 1px solid #3a3a4a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.theme-btn:hover {
  background-color: #353545;
  border-color: #2962ff;
}

.chart-container {
  flex: 1;
  min-height: 0;
  width: 100%;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .controls-bar {
    gap: 10px;
    padding: 10px;
  }
  
  .control-group select,
  .theme-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .control-group label {
    font-size: 12px;
  }
}
</style> -->

<template>
  <div class="tradingview-wrapper">
    <div class="controls-bar">
      <div class="control-group">
        <label>📊 Symbol:</label>
        <select v-model="currentSymbol" @change="onSymbolChange">
          <option value="XAUUSD">Gold Spot (XAU/USD)</option>
          <option value="DXY">US Dollar (DXY)</option>
          <option value="XAGUSD">Silver Spot (XAG/USD)</option>
          <option value="AUDUSD">AUD/USD</option>
          <option value="EURUSD">EUR/USD</option>
          <option value="GBPUSD">GBP/USD</option>
          <option value="BTCUSD">Bitcoin (BTC/USD)</option>
          <option value="SPX">📈 S&P 500 (SPX)</option>
        </select>
      </div>

      <div class="control-group">
        <label>⏱️ Interval:</label>
        <select v-model="currentInterval" @change="onIntervalChange">
          <option value="1">1 Minute</option>
          <option value="5">5 Minutes</option>
          <option value="15">15 Minutes</option>
          <option value="30">30 Minutes</option>
          <option value="60">1 Hour</option>
          <option value="240">4 Hours</option>
          <option value="D">Daily</option>
          <option value="W">Weekly</option>
          <option value="M">Monthly</option>
        </select>
      </div>

      <div class="control-group">
        <label>🎨 Theme:</label>
        <button @click="toggleTheme" class="theme-btn">
          {{ isDarkTheme ? '🌙 Dark' : '☀️ Light' }}
        </button>
      </div>
    </div>

    <!-- Signal Dashboard -->
    <div class="signal-dashboard" :class="{ 'dark': isDarkTheme }">
      <div class="dashboard-header">
        <h3>📈 Technical Signal Summary</h3>
        <div class="signal-timestamp">{{ lastUpdateTime }}</div>
      </div>
      
      <div class="signal-grid">
        <!-- Moving Average Signal -->
        <div class="signal-card">
          <div class="signal-header">
            <span class="indicator-name">📊 Moving Average</span>
            <span class="signal-badge" :class="getSignalClass(signals.MA)">
              {{ signals.MA }}
            </span>
          </div>
          <div class="signal-detail">MA 20/50 Crossover Strategy</div>
        </div>

        <!-- RSI Signal -->
        <div class="signal-card">
          <div class="signal-header">
            <span class="indicator-name">🔄 RSI (14)</span>
            <span class="signal-badge" :class="getSignalClass(signals.RSI)">
              {{ signals.RSI }}
            </span>
          </div>
          <div class="signal-detail">RSI Value: {{ rsiValue.toFixed(1) }} | {{ getRSIStatus() }}</div>
        </div>

        <!-- MACD Signal -->
        <div class="signal-card">
          <div class="signal-header">
            <span class="indicator-name">📉 MACD (12,26,9)</span>
            <span class="signal-badge" :class="getSignalClass(signals.MACD)">
              {{ signals.MACD }}
            </span>
          </div>
          <div class="signal-detail">{{ getMACDStatus() }}</div>
        </div>

        <!-- Bollinger Bands -->
        <div class="signal-card">
          <div class="signal-header">
            <span class="indicator-name">📦 Bollinger Bands</span>
            <span class="signal-badge" :class="getSignalClass(signals.BB)">
              {{ signals.BB }}
            </span>
          </div>
          <div class="signal-detail">{{ getBBStatus() }}</div>
        </div>

        <!-- Stochastic RSI -->
        <div class="signal-card">
          <div class="signal-header">
            <span class="indicator-name">⚡ Stochastic RSI</span>
            <span class="signal-badge" :class="getSignalClass(signals.StochRSI)">
              {{ signals.StochRSI }}
            </span>
          </div>
          <div class="signal-detail">K: {{ stochK.toFixed(1) }} | D: {{ stochD.toFixed(1) }}</div>
        </div>

        <!-- Overall Signal -->
        <div class="signal-card overall">
          <div class="signal-header">
            <span class="indicator-name">⭐ OVERALL SIGNAL</span>
            <span class="signal-badge overall-badge" :class="getOverallSignalClass()">
              {{ overallSignal }}
            </span>
          </div>
          <div class="signal-detail">Confidence: {{ getConfidenceLevel() }}</div>
        </div>
      </div>
    </div>

    <div id="tv_chart_container" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

// State
const currentSymbol = ref('XAUUSD')
const currentInterval = ref('5')
const isDarkTheme = ref(true)
const lastUpdateTime = ref('')
let tvWidget = null
let dataUpdateInterval = null

// Signal states
const signals = ref({
  MA: 'NEUTRAL',
  RSI: 'NEUTRAL',
  MACD: 'NEUTRAL',
  BB: 'NEUTRAL',
  StochRSI: 'NEUTRAL'
})

const rsiValue = ref(50)
const stochK = ref(50)
const stochD = ref(50)

// Computed overall signal
const overallSignal = ref('NEUTRAL')

// Mock price data - In production, replace with real API data
let mockPriceData = []

const generateMockData = () => {
  const now = new Date()
  const data = []
  let price = currentSymbol.value === 'XAUUSD' ? 2650 : 
             currentSymbol.value === 'BTCUSD' ? 65000 : 1.10
  
  for (let i = 100; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 2
    price = price + change
    data.push({
      time: new Date(now.getTime() - i * 60000),
      close: price,
      high: price + Math.random(),
      low: price - Math.random(),
      open: price - (Math.random() - 0.5) * 2
    })
  }
  return data
}

// Calculate Moving Average
const calculateMA = (data, period) => {
  if (data.length < period) return []
  const ma = []
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    ma.push(sum / period)
  }
  return ma
}

// Calculate RSI
const calculateRSI = (data, period = 14) => {
  if (data.length < period + 1) return 50
  
  let gains = 0
  let losses = 0
  
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close
    if (change >= 0) {
      gains += change
    } else {
      losses -= change
    }
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

// Calculate MACD
const calculateMACD = (data, fast = 12, slow = 26, signal = 9) => {
  const emaFast = calculateEMA(data, fast)
  const emaSlow = calculateEMA(data, slow)
  
  if (emaFast.length < signal || emaSlow.length < signal) return { macd: 0, signal: 0, histogram: 0 }
  
  const macdLine = emaFast[emaFast.length - 1] - emaSlow[emaSlow.length - 1]
  const signalLine = calculateEMA(macdLine, signal, data.length - signal)
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine
  }
}

// Calculate EMA helper
const calculateEMA = (data, period, startIndex = null) => {
  if (data.length < period) return []
  
  const multiplier = 2 / (period + 1)
  let ema = []
  
  // SMA as initial EMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i].close
  }
  let currentEMA = sum / period
  ema.push(currentEMA)
  
  for (let i = period; i < data.length; i++) {
    currentEMA = (data[i].close - currentEMA) * multiplier + currentEMA
    ema.push(currentEMA)
  }
  
  return ema
}

// Calculate Stochastic RSI
const calculateStochRSI = (data, period = 14) => {
  const rsiValues = []
  for (let i = period; i < data.length; i++) {
    const slice = data.slice(i - period, i)
    const rsi = calculateRSI(slice)
    rsiValues.push(rsi)
  }
  
  if (rsiValues.length < period) return { k: 50, d: 50 }
  
  const lastRSIs = rsiValues.slice(-period)
  const minRSI = Math.min(...lastRSIs)
  const maxRSI = Math.max(...lastRSIs)
  
  const stochK = maxRSI === minRSI ? 50 : 
    ((lastRSIs[lastRSIs.length - 1] - minRSI) / (maxRSI - minRSI)) * 100
  
  // Calculate %D (3-period SMA of %K)
  const kValues = []
  for (let i = rsiValues.length - period; i < rsiValues.length; i++) {
    const slice = rsiValues.slice(i - 3, i)
    const min = Math.min(...slice)
    const max = Math.max(...slice)
    kValues.push(max === min ? 50 : ((slice[slice.length - 1] - min) / (max - min)) * 100)
  }
  
  const stochD = kValues.slice(-3).reduce((a, b) => a + b, 0) / 3
  
  return { k: stochK, d: stochD }
}

// Calculate Bollinger Bands position
const calculateBBPosition = (data, period = 20, stdDev = 2) => {
  if (data.length < period) return 'MIDDLE'
  
  const closes = data.slice(-period).map(d => d.close)
  const currentPrice = data[data.length - 1].close
  
  const sma = closes.reduce((a, b) => a + b, 0) / period
  const variance = closes.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
  const std = Math.sqrt(variance)
  
  const upper = sma + (stdDev * std)
  const lower = sma - (stdDev * std)
  
  if (currentPrice >= upper) return 'OVERBOUGHT'
  if (currentPrice <= lower) return 'OVERSOLD'
  return 'MIDDLE'
}

// Update all signals based on current data
const updateSignals = () => {
  // Generate fresh mock data
  mockPriceData = generateMockData()
  
  // Calculate all indicators
  const currentPrice = mockPriceData[mockPriceData.length - 1].close
  const ma20 = calculateMA(mockPriceData, 20)
  const ma50 = calculateMA(mockPriceData, 50)
  
  // MA Signal
  if (ma20.length > 0 && ma50.length > 0) {
    const lastMA20 = ma20[ma20.length - 1]
    const lastMA50 = ma50[ma50.length - 1]
    const prevMA20 = ma20.length > 1 ? ma20[ma20.length - 2] : lastMA20
    const prevMA50 = ma50.length > 1 ? ma50[ma50.length - 2] : lastMA50
    
    if (lastMA20 > lastMA50 && prevMA20 <= prevMA50) {
      signals.value.MA = 'BUY'
    } else if (lastMA20 < lastMA50 && prevMA20 >= prevMA50) {
      signals.value.MA = 'SELL'
    } else if (lastMA20 > lastMA50) {
      signals.value.MA = 'BUY'
    } else if (lastMA20 < lastMA50) {
      signals.value.MA = 'SELL'
    } else {
      signals.value.MA = 'NEUTRAL'
    }
  }
  
  // RSI Signal
  rsiValue.value = calculateRSI(mockPriceData, 14)
  if (rsiValue.value > 70) {
    signals.value.RSI = 'SELL'
  } else if (rsiValue.value < 30) {
    signals.value.RSI = 'BUY'
  } else {
    signals.value.RSI = 'NEUTRAL'
  }
  
  // MACD Signal
  const macd = calculateMACD(mockPriceData)
  if (macd.histogram > 0 && macd.macd > macd.signal) {
    signals.value.MACD = 'BUY'
  } else if (macd.histogram < 0 && macd.macd < macd.signal) {
    signals.value.MACD = 'SELL'
  } else {
    signals.value.MACD = 'NEUTRAL'
  }
  
  // Bollinger Bands Signal
  const bbPosition = calculateBBPosition(mockPriceData)
  if (bbPosition === 'OVERSOLD') {
    signals.value.BB = 'BUY'
  } else if (bbPosition === 'OVERBOUGHT') {
    signals.value.BB = 'SELL'
  } else {
    signals.value.BB = 'NEUTRAL'
  }
  
  // Stochastic RSI Signal
  const stochRSI = calculateStochRSI(mockPriceData)
  stochK.value = stochRSI.k
  stochD.value = stochRSI.d
  
  if (stochRSI.k < 20 && stochRSI.d < 20) {
    signals.value.StochRSI = 'BUY'
  } else if (stochRSI.k > 80 && stochRSI.d > 80) {
    signals.value.StochRSI = 'SELL'
  } else if (stochRSI.k > stochRSI.d && stochRSI.k < 50) {
    signals.value.StochRSI = 'BUY'
  } else if (stochRSI.k < stochRSI.d && stochRSI.k > 50) {
    signals.value.StochRSI = 'SELL'
  } else {
    signals.value.StochRSI = 'NEUTRAL'
  }
  
  // Calculate Overall Signal
  const signalsArray = Object.values(signals.value)
  const buyCount = signalsArray.filter(s => s === 'BUY').length
  const sellCount = signalsArray.filter(s => s === 'SELL').length
  
  if (buyCount >= 3) {
    overallSignal.value = 'STRONG BUY'
  } else if (sellCount >= 3) {
    overallSignal.value = 'STRONG SELL'
  } else if (buyCount > sellCount) {
    overallSignal.value = 'BUY'
  } else if (sellCount > buyCount) {
    overallSignal.value = 'SELL'
  } else {
    overallSignal.value = 'NEUTRAL'
  }
  
  // Update timestamp
  lastUpdateTime.value = new Date().toLocaleTimeString()
}

// Helper methods for display
const getSignalClass = (signal) => {
  if (signal === 'BUY' || signal === 'STRONG BUY') return 'signal-buy'
  if (signal === 'SELL' || signal === 'STRONG SELL') return 'signal-sell'
  return 'signal-neutral'
}

const getOverallSignalClass = () => {
  if (overallSignal.value === 'STRONG BUY') return 'signal-strong-buy'
  if (overallSignal.value === 'STRONG SELL') return 'signal-strong-sell'
  if (overallSignal.value === 'BUY') return 'signal-buy'
  if (overallSignal.value === 'SELL') return 'signal-sell'
  return 'signal-neutral'
}

const getRSIStatus = () => {
  if (rsiValue.value > 70) return 'Overbought Zone'
  if (rsiValue.value < 30) return 'Oversold Zone'
  return 'Neutral Zone'
}

const getMACDStatus = () => {
  const macd = calculateMACD(mockPriceData)
  if (macd.histogram > 0) return 'Bullish Momentum (Histogram Positive)'
  if (macd.histogram < 0) return 'Bearish Momentum (Histogram Negative)'
  return 'Neutral Momentum'
}

const getBBStatus = () => {
  const position = calculateBBPosition(mockPriceData)
  if (position === 'OVERBOUGHT') return 'Price near Upper Band - Potential Reversal'
  if (position === 'OVERSOLD') return 'Price near Lower Band - Potential Bounce'
  return 'Price within Bands'
}

const getConfidenceLevel = () => {
  const buyCount = Object.values(signals.value).filter(s => s === 'BUY').length
  const sellCount = Object.values(signals.value).filter(s => s === 'SELL').length
  const total = Object.values(signals.value).length
  const max = Math.max(buyCount, sellCount)
  const percentage = (max / total) * 100
  
  if (percentage >= 80) return 'High'
  if (percentage >= 60) return 'Medium'
  return 'Low'
}

// TradingView Widget Methods
const loadTradingViewScript = () => {
  return new Promise((resolve, reject) => {
    if (window.TradingView) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load TradingView script'))
    document.head.appendChild(script)
  })
}

const initChart = async () => {
  try {
    await loadTradingViewScript()
    
    if (tvWidget) {
      tvWidget.remove()
      tvWidget = null
    }
    
    const container = document.getElementById('tv_chart_container')
    if (container) {
      container.innerHTML = ''
    }
    
    tvWidget = new window.TradingView.widget({
      symbol: currentSymbol.value,
      interval: currentInterval.value,
      timezone: 'Asia/Phnom_Penh',
      theme: isDarkTheme.value ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      toolbar_bg: isDarkTheme.value ? '#131722' : '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
      container_id: 'tv_chart_container',
      height: '100%',
      width: '100%',
      autosize: true,
      save_load_adapter: {
        save: function() {},
        load: function() {}
      },
      loading_screen: { backgroundColor: isDarkTheme.value ? '#131722' : '#ffffff' }
    })
    
    tvWidget.onChartReady(() => {
      console.log('Chart ready with timezone:', tvWidget.options().timezone)
    })
    
  } catch (error) {
    console.error('Error initializing chart:', error)
  }
}

// Event handlers
const onSymbolChange = () => {
  if (tvWidget && tvWidget.setSymbol) {
    tvWidget.setSymbol(currentSymbol.value, currentInterval.value)
  } else {
    initChart()
  }
  updateSignals()
}

const onIntervalChange = () => {
  if (tvWidget && tvWidget.setInterval) {
    tvWidget.setInterval(currentInterval.value)
  } else {
    initChart()
  }
  updateSignals()
}

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  initChart()
}

// Watch for symbol changes
watch([currentSymbol, currentInterval], () => {
  updateSignals()
})

// Lifecycle
onMounted(() => {
  initChart()
  updateSignals()
  
  // Update signals every 10 seconds for real-time simulation
  dataUpdateInterval = setInterval(() => {
    updateSignals()
  }, 10000)
})

onBeforeUnmount(() => {
  if (tvWidget) {
    tvWidget.remove()
    tvWidget = null
  }
  if (dataUpdateInterval) {
    clearInterval(dataUpdateInterval)
  }
})
</script>

<style scoped>
.tradingview-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #f5f5f5;
}

.controls-bar {
  display: flex;
  gap: 20px;
  padding: 12px 20px;
  background-color: #1e1e2e;
  border-bottom: 1px solid #3a3a4a;
  flex-wrap: wrap;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-group label {
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
}

.control-group select {
  padding: 8px 12px;
  background-color: #2d2d2d;
  color: #e0e0e0;
  border: 1px solid #3a3a4a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.control-group select:hover {
  border-color: #2962ff;
  background-color: #353545;
}

.theme-btn {
  padding: 8px 16px;
  background-color: #2d2d2d;
  color: #e0e0e0;
  border: 1px solid #3a3a4a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.theme-btn:hover {
  background-color: #353545;
  border-color: #2962ff;
}

.signal-dashboard {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 20px;
}

.signal-dashboard.dark {
  background: #1e1e2e;
  color: #e0e0e0;
  border-bottom-color: #3a3a4a;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dashboard-header h3 {
  margin: 0;
  font-size: 16px;
}

.signal-timestamp {
  font-size: 12px;
  color: #666;
}

.dark .signal-timestamp {
  color: #999;
}

.signal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.signal-card {
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
  border-left: 4px solid #ddd;
}

.dark .signal-card {
  background: #2d2d35;
}

.signal-card.overall {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-left: 4px solid #ffd700;
}

.signal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.indicator-name {
  font-weight: 600;
  font-size: 14px;
}

.signal-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.signal-buy {
  background: #10b981;
  color: white;
}

.signal-sell {
  background: #ef4444;
  color: white;
}

.signal-neutral {
  background: #6b7280;
  color: white;
}

.signal-strong-buy {
  background: #059669;
  color: white;
  animation: pulse 1s infinite;
}

.signal-strong-sell {
  background: #dc2626;
  color: white;
  animation: pulse 1s infinite;
}

.overall-badge {
  font-size: 14px;
  font-weight: 800;
}

.signal-detail {
  font-size: 12px;
  color: #666;
}

.dark .signal-detail {
  color: #aaa;
}

.overall .signal-detail {
  color: rgba(255,255,255,0.9);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.chart-container {
  flex: 1;
  min-height: 0;
  width: 100%;
}

@media (max-width: 768px) {
  .controls-bar {
    gap: 10px;
    padding: 10px;
  }
  
  .control-group select,
  .theme-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .signal-grid {
    grid-template-columns: 1fr;
  }
  
  .signal-card {
    padding: 8px;
  }
}
</style>