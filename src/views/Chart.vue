<template>
  <div class="tradingview-container">
    <div class="symbol-tabs">
      <button 
        v-for="symbol in symbols" 
        :key="symbol.id"
        :class="['tab-btn', { active: activeSymbol === symbol.id }]"
        @click="changeSymbol(symbol.id)"
      >
        <span class="symbol-icon">{{ symbol.icon }}</span>
        <span class="symbol-name">{{ symbol.name }}</span>
        <span class="symbol-code">{{ symbol.code }}</span>
      </button>
    </div>
    
    <div class="chart-container">
      <div 
        v-for="symbol in symbols" 
        :key="symbol.id"
        :id="`tv-widget-${symbol.id}`"
        class="tv-widget"
        :class="{ active: activeSymbol === symbol.id }"
      ></div>
    </div>
    
    <div class="chart-info">
      <div class="info-item">
        <span class="info-label">Data Source:</span>
        <span class="info-value">TradingView</span>
      </div>
      <div class="info-item">
        <span class="info-label">Real-time:</span>
        <span class="info-value">Delayed by exchange</span>
      </div>
      <div class="info-item">
        <span class="info-label">Time Zone:</span>
        <span class="info-value">UTC</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

// Symbol definitions
const symbols = ref([
  {
    id: 'xauusd',
    name: 'Gold',
    code: 'XAUUSD',
    icon: '🥇',
    tradingViewSymbol: 'FX_IDC:XAUUSD',
    description: 'Gold Spot / US Dollar'
  },
  {
    id: 'dxy',
    name: 'Dollar Index',
    code: 'DXY',
    icon: '💵',
    tradingViewSymbol: 'TVC:DXY',
    description: 'US Dollar Index'
  },
  {
    id: 'usoil',
    name: 'Crude Oil',
    code: 'USOIL',
    icon: '🛢️',
    tradingViewSymbol: 'TVC:USOIL',
    description: 'WTI Crude Oil'
  }
])

const activeSymbol = ref('xauusd')
let widgets = ref({})
let resizeObserver = null

// Theme detection
const getTheme = () => {
  const theme = localStorage.getItem('theme') || 'light'
  return theme === 'dark' ? 'dark' : 'light'
}

// Create widget for a symbol
const createWidget = (symbolId) => {
  const symbol = symbols.value.find(s => s.id === symbolId)
  if (!symbol) return

  const container = document.getElementById(`tv-widget-${symbolId}`)
  if (!container) return

  // Clear container
  container.innerHTML = ''
  
  // Create widget container
  const widgetContainer = document.createElement('div')
  widgetContainer.id = `tv-chart-${symbolId}`
  widgetContainer.style.width = '100%'
  widgetContainer.style.height = '100%'
  container.appendChild(widgetContainer)
  
  // Create script element
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = 'https://s3.tradingview.com/tv.js'
  script.async = true
  
  script.onload = () => {
    if (window.TradingView) {
      try {
        const widget = new window.TradingView.widget({
          width: '100%',
          height: '100%',
          symbol: symbol.tradingViewSymbol,
          interval: '60',
          timezone: 'Etc/UTC',
          theme: getTheme(),
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: `tv-chart-${symbolId}`,
          hide_top_toolbar: false,
          hide_side_toolbar: false,
          studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
          save_image: false,
          autosize: true
        })
        
        widgets.value[symbolId] = widget
      } catch (error) {
        console.error(`Error creating widget for ${symbol.code}:`, error)
      }
    } else {
      console.error('TradingView library not loaded')
    }
  }
  
  script.onerror = () => {
    console.error('Failed to load TradingView script')
    container.innerHTML = '<div class="error-message">Failed to load chart. Please check your internet connection and try again.</div>'
  }
  
  document.head.appendChild(script)
}

// Change active symbol
const changeSymbol = (symbolId) => {
  activeSymbol.value = symbolId
  
  // If widget doesn't exist for this symbol, create it
  if (!widgets.value[symbolId]) {
    setTimeout(() => {
      createWidget(symbolId)
    }, 100)
  }
}

// Refresh widget theme
const refreshWidgetTheme = () => {
  const currentTheme = getTheme()
  Object.keys(widgets.value).forEach(symbolId => {
    if (widgets.value[symbolId]) {
      try {
        // TradingView widgets have a method to change theme
        if (widgets.value[symbolId].setTheme) {
          widgets.value[symbolId].setTheme(currentTheme)
        } else {
          // If direct method doesn't exist, recreate the widget
          const container = document.getElementById(`tv-widget-${symbolId}`)
          if (container && activeSymbol.value === symbolId) {
            container.innerHTML = ''
            widgets.value[symbolId] = null
            createWidget(symbolId)
          }
        }
      } catch (error) {
        console.error('Error refreshing theme:', error)
      }
    }
  })
}

// Handle window resize
const handleResize = () => {
  Object.keys(widgets.value).forEach(symbolId => {
    if (widgets.value[symbolId] && widgets.value[symbolId].resize) {
      try {
        widgets.value[symbolId].resize()
      } catch (error) {
        console.error('Error resizing widget:', error)
      }
    }
  })
}

// Watch for theme changes in localStorage
const watchThemeChanges = () => {
  const originalSetItem = localStorage.setItem
  localStorage.setItem = function(key, value) {
    const event = new Event('storage')
    event.key = key
    event.newValue = value
    window.dispatchEvent(event)
    originalSetItem.apply(this, arguments)
  }
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      refreshWidgetTheme()
    }
  })
}

onMounted(() => {
  // Create initial widget
  createWidget(activeSymbol.value)
  
  // Set up resize observer
  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })
  
  const container = document.querySelector('.chart-container')
  if (container) {
    resizeObserver.observe(container)
  }
  
  // Watch for theme changes
  watchThemeChanges()
  
  // Handle window resize
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Clean up widgets
  Object.keys(widgets.value).forEach(symbolId => {
    if (widgets.value[symbolId] && widgets.value[symbolId].destroy) {
      try {
        widgets.value[symbolId].destroy()
      } catch (error) {
        console.error('Error destroying widget:', error)
      }
    }
  })
  
  // Clean up resize observer
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  
  // Remove event listeners
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.tradingview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border-radius: 12px;
  overflow: hidden;
}

/* Symbol Tabs */
.symbol-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.tab-btn:hover {
  transform: translateY(-2px);
  background: var(--bg-hover);
  border-color: var(--primary-color);
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
}

.symbol-icon {
  font-size: 18px;
}

.symbol-name {
  font-weight: 600;
}

.symbol-code {
  font-size: 12px;
  opacity: 0.8;
  font-family: monospace;
}

.tab-btn.active .symbol-code {
  opacity: 1;
}

/* Chart Container */
.chart-container {
  flex: 1;
  position: relative;
  min-height: 500px;
  background: var(--bg-panel);
}

.tv-widget {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.tv-widget.active {
  opacity: 1;
  visibility: visible;
  position: relative;
}

/* Chart Info */
.chart-info {
  display: flex;
  gap: 24px;
  padding: 12px 20px;
  background: var(--bg-header);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.info-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.info-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  color: var(--text-main);
  font-weight: 600;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ef4444;
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

/* Theme Variables */
.layout.light {
  --bg-panel: #ffffff;
  --bg-header: #f8fafc;
  --border-color: #e2e8f0;
  --bg-hover: #f1f5f9;
  --primary-color: #38bdf8;
  --primary-dark: #0ea5e9;
  --text-main: #0f172a;
  --text-secondary: #64748b;
}

.layout.dark {
  --bg-panel: #1e293b;
  --bg-header: #0f172a;
  --border-color: #334155;
  --bg-hover: #334155;
  --primary-color: #38bdf8;
  --primary-dark: #0ea5e9;
  --text-main: #e2e8f0;
  --text-secondary: #94a3b8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .symbol-tabs {
    padding: 12px 16px;
    gap: 6px;
  }
  
  .tab-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .symbol-icon {
    font-size: 14px;
  }
  
  .symbol-name {
    display: none;
  }
  
  .symbol-code {
    font-size: 11px;
  }
  
  .chart-container {
    min-height: 400px;
  }
  
  .chart-info {
    padding: 8px 16px;
    gap: 16px;
    font-size: 10px;
  }
  
  .info-item {
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .symbol-tabs {
    padding: 10px 12px;
  }
  
  .tab-btn {
    padding: 5px 10px;
    gap: 4px;
  }
  
  .symbol-icon {
    font-size: 12px;
  }
  
  .symbol-code {
    font-size: 10px;
  }
  
  .chart-container {
    min-height: 350px;
  }
  
  .chart-info {
    padding: 6px 12px;
    gap: 12px;
    font-size: 9px;
  }
}

/* Landscape Mode */
@media (max-width: 768px) and (orientation: landscape) {
  .chart-container {
    min-height: 300px;
  }
  
  .symbol-tabs {
    padding: 8px 12px;
  }
  
  .tab-btn {
    padding: 4px 8px;
  }
}

/* Tablet Styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .tab-btn {
    padding: 8px 16px;
  }
  
  .chart-container {
    min-height: 450px;
  }
}

/* Large Screens */
@media (min-width: 1440px) {
  .symbol-tabs {
    padding: 20px 24px;
  }
  
  .tab-btn {
    padding: 12px 24px;
    font-size: 16px;
  }
  
  .symbol-icon {
    font-size: 20px;
  }
  
  .symbol-code {
    font-size: 14px;
  }
  
  .chart-container {
    min-height: 600px;
  }
  
  .chart-info {
    padding: 16px 24px;
    font-size: 14px;
  }
}
</style>