<template>
  <div class="tradingview-wrapper">

    <!-- Controls -->
    <div class="controls-bar">

      <!-- Symbol -->
      <div class="control-group">
        <label>📊 Symbol:</label>

        <select v-model="currentSymbol" @change="reloadWidgets">
          <option value="OANDA:XAUUSD">Gold Spot (XAU/USD)</option>
          <option value="TVC:DXY">US Dollar Index (DXY)</option>
          <option value="OANDA:XAGUSD">Silver Spot (XAG/USD)</option>
          <option value="OANDA:AUDUSD">AUD/USD</option>
          <option value="OANDA:EURUSD">EUR/USD</option>
          <option value="OANDA:GBPUSD">GBP/USD</option>
          <option value="BINANCE:BTCUSDT">Bitcoin (BTC/USD)</option>
          <option value="SP:SPX">S&P 500 (SPX)</option>
        </select>
      </div>

      <!-- Interval -->
      <div class="control-group">
        <label>⏱️ Interval:</label>

        <select v-model="currentInterval" @change="reloadWidgets">
          <option value="1m">1 Minute</option>
          <option value="5m">5 Minutes</option>
          <option value="15m">15 Minutes</option>
          <option value="30m">30 Minutes</option>
          <option value="1h">1 Hour</option>
          <option value="4h">4 Hours</option>
          <option value="1D">Daily</option>
          <option value="1W">Weekly</option>
        </select>
      </div>

      <!-- Theme -->
      <div class="control-group">
        <label>🎨 Theme:</label>

        <button @click="toggleTheme" class="theme-btn">
          {{ isDarkTheme ? '🌙 Dark' : '☀️ Light' }}
        </button>
      </div>

    </div>

    <!-- BUY / SELL Technical Analysis Widget -->
    <div class="technical-analysis-wrapper">
      <div id="technical-analysis-widget"></div>
    </div>

    <!-- Main TradingView Chart -->
    <div id="tv_chart_container" class="chart-container"></div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// =========================
// STATE
// =========================

const currentSymbol = ref('OANDA:XAUUSD')
const currentInterval = ref('5m')
const isDarkTheme = ref(true)

let tvWidget = null

// =========================
// LOAD SCRIPT
// =========================

const loadTradingViewScript = () => {
  return new Promise((resolve, reject) => {

    // Already loaded
    if (window.TradingView) {
      resolve()
      return
    }

    const script = document.createElement('script')

    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true

    script.onload = () => {
      console.log('TradingView script loaded')
      resolve()
    }

    script.onerror = () => {
      reject(new Error('Failed to load TradingView'))
    }

    document.head.appendChild(script)
  })
}

// =========================
// MAIN CHART
// =========================

const initChart = async () => {

  await loadTradingViewScript()

  // Remove old widget
  if (tvWidget) {
    tvWidget.remove()
    tvWidget = null
  }

  // Clear container
  const chartContainer = document.getElementById(
    'tv_chart_container'
  )

  if (chartContainer) {
    chartContainer.innerHTML = ''
  }

  // Create chart
  tvWidget = new window.TradingView.widget({
    symbol: currentSymbol.value,

    interval: convertIntervalForChart(
      currentInterval.value
    ),

    timezone: 'Asia/Phnom_Penh',

    theme: isDarkTheme.value
      ? 'dark'
      : 'light',

    style: '1',

    locale: 'en',

    toolbar_bg: isDarkTheme.value
      ? '#131722'
      : '#f1f3f6',

    enable_publishing: false,

    allow_symbol_change: true,

    hide_side_toolbar: false,

    studies: [
      'MASimple@tv-basicstudies',
      'RSI@tv-basicstudies',
      'MACD@tv-basicstudies'
    ],

    container_id: 'tv_chart_container',

    autosize: true,

    width: '100%',

    height: '100%',

    loading_screen: {
      backgroundColor: isDarkTheme.value
        ? '#131722'
        : '#ffffff'
    }
  })

  tvWidget.onChartReady(() => {
    console.log('Chart ready')
  })
}

// =========================
// TECHNICAL ANALYSIS
// =========================

const initTechnicalAnalysis = () => {

  const container = document.getElementById(
    'technical-analysis-widget'
  )

  if (!container) return

  // Clear previous widget
  container.innerHTML = ''

  const script = document.createElement('script')

  script.src =
    'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js'

  script.type = 'text/javascript'

  script.async = true

  script.innerHTML = JSON.stringify({
    interval: convertIntervalForTechnicalWidget(
      currentInterval.value
    ),

    width: '100%',

    isTransparent: false,

    height: 450,

    symbol: currentSymbol.value,

    showIntervalTabs: true,

    locale: 'en',

    colorTheme: isDarkTheme.value
      ? 'dark'
      : 'light'
  })

  container.appendChild(script)
}

// =========================
// INTERVAL MAPPING
// =========================

const convertIntervalForChart = (interval) => {

  const mapping = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1D': 'D',
    '1W': 'W'
  }

  return mapping[interval] || '5'
}

const convertIntervalForTechnicalWidget = (
  interval
) => {

  const mapping = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1D': '1D',
    '1W': '1W'
  }

  return mapping[interval] || '5m'
}

// =========================
// RELOAD EVERYTHING
// =========================

const reloadWidgets = async () => {

  console.log(
    `Reloading: ${currentSymbol.value} (${currentInterval.value})`
  )

  await initChart()

  initTechnicalAnalysis()
}

// =========================
// THEME TOGGLE
// =========================

const toggleTheme = async () => {

  isDarkTheme.value = !isDarkTheme.value

  await reloadWidgets()
}

// =========================
// LIFECYCLE
// =========================

onMounted(async () => {

  await reloadWidgets()
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #131722;
  overflow: hidden;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

/* =========================
   CONTROLS
========================= */

.controls-bar {
  display: flex;
  gap: 20px;
  padding: 14px 20px;
  background-color: #1e222d;
  border-bottom: 1px solid #2a2e39;
  flex-wrap: wrap;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-group label {
  color: #d1d4dc;
  font-size: 14px;
  font-weight: 600;
}

.control-group select {
  padding: 8px 12px;
  background-color: #2a2e39;
  color: #d1d4dc;
  border: 1px solid #434651;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.control-group select:hover {
  border-color: #2962ff;
}

.control-group select:focus {
  outline: none;
  border-color: #2962ff;
}

/* =========================
   BUTTON
========================= */

.theme-btn {
  padding: 8px 16px;
  background-color: #2a2e39;
  color: #d1d4dc;
  border: 1px solid #434651;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.theme-btn:hover {
  border-color: #2962ff;
  background-color: #323546;
}

/* =========================
   TECHNICAL ANALYSIS
========================= */

.technical-analysis-wrapper {
  padding: 10px;
  background-color: #131722;
}

#technical-analysis-widget {
  width: 100%;
  min-height: 450px;
  border-radius: 8px;
  overflow: hidden;
}

/* =========================
   CHART
========================= */

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 500px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 768px) {

  .controls-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .control-group {
    justify-content: space-between;
  }

  .control-group select,
  .theme-btn {
    width: 180px;
  }

  #technical-analysis-widget {
    min-height: 420px;
  }
}
</style>