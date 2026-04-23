<template>
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
</style>