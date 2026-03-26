<template>
  <div class="tradingview-page">
    <div class="page-header">
      <h1 class="page-title">Market Charts</h1>
      <p class="page-description">Real-time charts for major trading instruments</p>
    </div>

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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

// Symbol definitions with correct TradingView symbols
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
let currentTheme = ref('light')

// Get current theme
const getCurrentTheme = () => {
  const theme = localStorage.getItem('theme') || 'light'
  currentTheme.value = theme
  return theme === 'dark' ? 'dark' : 'light'
}

// Create widget using TradingView's widget constructor
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
  
  // Check if TradingView is already loaded
  if (window.TradingView) {
    initWidget(symbolId, widgetContainer.id, symbol.tradingViewSymbol)
  } else {
    // Load TradingView widget library
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    
    script.onload = () => {
      initWidget(symbolId, widgetContainer.id, symbol.tradingViewSymbol)
    }
    
    script.onerror = () => {
      console.error('Failed to load TradingView script')
      container.innerHTML = '<div class="error-message">Failed to load chart. Please check your internet connection.</div>'
    }
    
    document.head.appendChild(script)
  }
}

// Initialize widget with proper configuration
const initWidget = (symbolId, containerId, tradingViewSymbol) => {
  const theme = getCurrentTheme()
  
  // Create widget configuration
  const widgetConfig = {
    width: '100%',
    height: '100%',
    symbol: tradingViewSymbol,
    interval: '60',
    timezone: 'Etc/UTC',
    theme: theme,
    style: '1',
    locale: 'en',
    toolbar_bg: theme === 'dark' ? '#1e293b' : '#f1f3f6',
    enable_publishing: false,
    allow_symbol_change: true,
    container_id: containerId,
    hide_top_toolbar: false,
    hide_side_toolbar: false,
    studies: [
      "MASimple@tv-basicstudies",
      "RSI@tv-basicstudies",
      "Volume@tv-basicstudies"
    ],
    save_image: false,
    autosize: true
  }
  
  // Create the widget
  try {
    const widget = new TradingView.widget(widgetConfig)
    widgets.value[symbolId] = widget
    
    // Store the widget for potential future updates
    if (!window.tradingViewWidgets) {
      window.tradingViewWidgets = {}
    }
    window.tradingViewWidgets[symbolId] = widget
    
    console.log(`Widget created for ${symbolId}`)
  } catch (error) {
    console.error(`Error creating widget for ${symbolId}:`, error)
    const container = document.getElementById(`tv-widget-${symbolId}`)
    if (container) {
      container.innerHTML = '<div class="error-message">Error loading chart. Please refresh the page.</div>'
    }
  }
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

// Update widget theme when theme changes
const updateWidgetTheme = () => {
  const newTheme = getCurrentTheme()
  
  Object.keys(widgets.value).forEach(symbolId => {
    const widget = widgets.value[symbolId]
    if (widget && widget.setTheme) {
      try {
        widget.setTheme(newTheme)
      } catch (error) {
        console.error('Error updating widget theme:', error)
      }
    }
  })
}

// Watch for theme changes in localStorage
watch(() => localStorage.getItem('theme'), () => {
  updateWidgetTheme()
})

// Handle window resize
const handleResize = () => {
  Object.keys(widgets.value).forEach(symbolId => {
    const widget = widgets.value[symbolId]
    if (widget && widget.resize) {
      try {
        widget.resize()
      } catch (error) {
        console.error('Error resizing widget:', error)
      }
    }
  })
}

onMounted(() => {
  // Create initial widget
  createWidget(activeSymbol.value)
  
  // Set up resize observer
  const resizeObserver = new ResizeObserver(() => {
    setTimeout(handleResize, 100)
  })
  
  const container = document.querySelector('.chart-container')
  if (container) {
    resizeObserver.observe(container)
  }
  
  // Handle window resize
  window.addEventListener('resize', handleResize)
  
  // Clean up on unmount
  onUnmounted(() => {
    resizeObserver.disconnect()
    window.removeEventListener('resize', handleResize)
    
    // Clean up widgets
    Object.keys(widgets.value).forEach(symbolId => {
      const widget = widgets.value[symbolId]
      if (widget && widget.remove) {
        try {
          widget.remove()
        } catch (error) {
          console.error('Error removing widget:', error)
        }
      }
    })
  })
})
</script>

<style scoped>
.tradingview-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.tradingview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border-radius: 12px;
  overflow: hidden;
  min-height: 0;
  border: 1px solid var(--border-color);
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
  border-color: #38bdf8;
}

.tab-btn.active {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
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
  --text-main: #0f172a;
  --text-secondary: #64748b;
}

.layout.dark {
  --bg-panel: #1e293b;
  --bg-header: #0f172a;
  --border-color: #334155;
  --bg-hover: #334155;
  --text-main: #e2e8f0;
  --text-secondary: #94a3b8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-header {
    margin-bottom: 16px;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
  
  .page-description {
    font-size: 0.75rem;
  }
  
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
  .chart-container {
    min-height: 350px;
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
  .page-title {
    font-size: 2rem;
  }
  
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
  
  .chart-container {
    min-height: 600px;
  }
}
</style>