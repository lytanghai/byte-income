<template>
  <div class="report-page">
    <!-- Header -->
    <div class="page-header">
      <h1>Performance Report</h1>
      <p class="subtitle">Generate and view detailed trading performance reports</p>
    </div>

    <!-- Report Generator Card -->
    <div class="generator-card">
      <div class="generator-header">
        <h2>Generate New Report</h2>
        <span class="generator-badge">Last 30 Days</span>
      </div>

      <div class="generator-form">
        <div class="form-group">
          <label for="lastNDays" class="form-label">Time Period (Days)</label>
          <div class="input-wrapper">
            <input 
              type="number" 
              id="lastNDays"
              v-model="lastNDays" 
              min="1"
              max="365"
              class="form-input"
              placeholder="Enter number of days"
            />
            <span class="input-suffix">days</span>
          </div>
          <p class="form-hint">Generate report for the last {{ lastNDays }} days of trading activity</p>
        </div>

        <div class="form-actions">
          <button 
            @click="generateReport" 
            class="btn btn-primary"
            :disabled="generating || !lastNDays"
          >
            <span v-if="generating" class="spinner-small"></span>
            {{ generating ? 'Generating...' : 'Generate Report' }}
          </button>
          <button 
            v-if="reportData.length > 0"
            @click="exportToCSV" 
            class="btn btn-secondary"
          >
            Export to CSV
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="generating" class="loading-state">
      <div class="spinner"></div>
      <p>Generating your report...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="generateReport" class="btn-retry">Try Again</button>
    </div>

    <!-- Report Results -->
    <div v-else-if="reportData.length > 0" class="report-results">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <span class="summary-label">Total Profit</span>
            <span class="summary-value profit">
              {{ formatCurrency(totalSummary.totalProfit) }}
            </span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">📉</div>
          <div class="summary-content">
            <span class="summary-label">Total Loss</span>
            <span class="summary-value loss">
              {{ formatCurrency(totalSummary.totalLoss) }}
            </span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">💰</div>
          <div class="summary-content">
            <span class="summary-label">Net P&L</span>
            <span class="summary-value" :class="getProfitClass(totalSummary.netPnL)">
              {{ formatCurrency(totalSummary.netPnL) }}
            </span>
          </div>
        </div>

         <div class="summary-card">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <span class="summary-label">Total Deposit</span>
            <span class="summary-value profit">
              {{ formatCurrency(totalSummary.totalDeposit) }}
            </span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <span class="summary-label">Total Withdrawal</span>
            <span class="summary-value profit">
              {{ formatCurrency(totalSummary.totalWithdrawal) }}
            </span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">🏆</div>
          <div class="summary-content">
            <span class="summary-label">Win Rate</span>
            <span class="summary-value">{{ totalSummary.winRate }}%</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">📅</div>
          <div class="summary-content">
            <span class="summary-label">Period</span>
            <span class="summary-value">{{ lastNDays }} days</span>
            <span class="summary-label">Transactions: <span class="summary-value">{{ reportData.length }}</span></span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Profit by Symbol Bar Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Profit/Loss by Symbol</h3>
            <div class="chart-legend">
              <span class="legend-item profit">Profit</span>
              <span class="legend-item loss">Loss</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="symbolChartCanvas" class="chart-canvas"></canvas>
          </div>
        </div>

        <!-- Profit Distribution Pie Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Profit Distribution</h3>
            <div class="chart-legend">
              <span class="legend-item profit">Winning Symbols</span>
              <span class="legend-item loss">Losing Symbols</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="distributionChartCanvas" class="chart-canvas"></canvas>
          </div>
        </div>

        <!-- Performance Trend Line Chart -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>Performance Trend</h3>
            <div class="chart-legend">
              <span class="legend-item profit">Cumulative Profit</span>
              <span class="legend-item loss">Individual Profit</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="trendChartCanvas" class="chart-canvas"></canvas>
          </div>
        </div>

        <!-- Win/Loss Ratio Gauge -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Win/Loss Ratio</h3>
          </div>
          <div class="gauge-container">
            <div class="gauge">
              <div class="gauge-segment win" :style="{ width: totalSummary.winRate + '%' }">
                {{ totalSummary.winRate }}% Wins
              </div>
              <div class="gauge-segment loss" :style="{ width: (100 - totalSummary.winRate) + '%' }">
                {{ (100 - totalSummary.winRate).toFixed(1) }}% Losses
              </div>
            </div>
            <div class="gauge-stats">
              <div class="gauge-stat">
                <span class="stat-dot win"></span>
                <span>Wins: {{ winsCount }}</span>
              </div>
              <div class="gauge-stat">
                <span class="stat-dot loss"></span>
                <span>Losses: {{ lossesCount }}</span>
              </div>
              <div class="gauge-stat">
                <span class="stat-dot draw"></span>
                <span>Draws: {{ drawsCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Profit Range Distribution -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Profit Range Distribution</h3>
          </div>
          <div class="range-bars">
            <div v-for="range in profitRanges" :key="range.label" class="range-item">
              <span class="range-label">{{ range.label }}</span>
              <div class="range-bar-wrapper">
                <div 
                  class="range-bar" 
                  :class="range.class"
                  :style="{ width: range.percentage + '%' }"
                ></div>
              </div>
              <span class="range-value">{{ range.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics Cards -->
      <div class="metrics-section">
        <div class="metric-card">
          <div class="metric-icon">📈</div>
          <div class="metric-content">
            <span class="metric-label">Best Performer</span>
            <span class="metric-value profit">{{ bestSymbol.symbol }}</span>
            <span class="metric-subvalue">{{ formatCurrency(bestSymbol.profit) }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">📉</div>
          <div class="metric-content">
            <span class="metric-label">Worst Performer</span>
            <span class="metric-value loss">{{ worstSymbol.symbol }}</span>
            <span class="metric-subvalue">{{ formatCurrency(worstSymbol.loss) }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-content">
            <span class="metric-label">Average Profit/Trade</span>
            <span class="metric-value" :class="getProfitClass(totalSummary.averageProfit)">
              {{ formatCurrency(totalSummary.averageProfit) }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">⚖️</div>
          <div class="metric-content">
            <span class="metric-label">Profit Factor</span>
            <span class="metric-value">{{ totalSummary.profitFactor }}</span>
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <div class="table-container">
        <div class="table-header">
          <h3>Detailed Report</h3>
          <div class="table-filters">
            <select v-model="filterSymbol" @change="applyFilters" class="filter-select">
              <option value="">All Symbols</option>
              <option v-for="symbol in uniqueSymbols" :key="symbol" :value="symbol">
                {{ symbol }}
              </option>
            </select>
            <select v-model="filterResult" @change="applyFilters" class="filter-select">
              <option value="">All Results</option>
              <option value="WIN">Win</option>
              <option value="LOSS">Loss</option>
              <option value="DRAW">Draw</option>
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="report-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Currency</th>
                <th>Result</th>
                <th>Profit</th>
                <th>Total Profit</th>
                <th>Total Loss</th>
                <th>Net P&L</th>
                <th>Most Gained</th>
                <th>Most Loss</th>
                <th>Deposits</th>
                <th>Withdrawals</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredReport" :key="item.symbol + item.currency">
                <td class="symbol-cell">
                  <span class="symbol-badge">{{ item.symbol }}</span>
                </td>
                <td>{{ item.currency }}</td>
                <td>
                  <span class="result-badge" :class="item.result.toLowerCase()">
                    {{ item.result }}
                  </span>
                </td>
                <td :class="getProfitClass(item.profit)">{{ formatCurrency(item.profit) }}</td>
                <td class="profit">{{ formatCurrency(item.total_profit) }}</td>
                <td class="loss">{{ formatCurrency(item.total_loss) }}</td>
                <td :class="getProfitClass(item.total_profit - item.total_loss)">
                  {{ formatCurrency(item.total_profit - item.total_loss) }}
                </td>
                <td>{{ formatDate(item.most_gained_date) }}</td>
                <td class="loss">{{ formatDate(item.most_loss_date) }}</td>
                <td>{{ formatCurrency(item.total_deposit) }}</td>
                <td>{{ formatCurrency(item.total_withdrawal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else-if="!generating && !error" class="no-data">
      <div class="no-data-icon">📈</div>
      <h3>No Report Generated</h3>
      <p>Select the number of days and generate a report to see your trading performance</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useNotification } from '../composables/useNotification'
import Chart from 'chart.js/auto'
import { formatMoney } from '../services/util'

// Initialize notification
const notification = useNotification()

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// State
const lastNDays = ref(30)
const reportData = ref([])
const generating = ref(false)
const error = ref(null)

// Filters
const filterSymbol = ref('')
const filterResult = ref('')

// Chart refs
const symbolChartCanvas = ref(null)
const distributionChartCanvas = ref(null)
const trendChartCanvas = ref(null)
let symbolChart = null
let distributionChart = null
let trendChart = null

// Get auth token
const getAuthToken = () => {
  const authToken = localStorage.getItem('authToken')
  if (!authToken) {
    notification.error('No authentication token found')
    throw new Error('No authentication token found')
  }
  return authToken
}

// Generate report
const generateReport = async () => {
  if (!lastNDays.value || lastNDays.value < 1) {
    notification.error('Please enter a valid number of days')
    return
  }

  generating.value = true
  error.value = null

  try {
    const token = getAuthToken()

    const response = await fetch(`${API_BASE_URL}/report/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        last_n_day: parseInt(lastNDays.value)
      })
    })

    const data = await response.json()

    if (data.code === '200') {
      reportData.value = data.data || []
      notification.success(`Report generated successfully for the last ${lastNDays.value} days`)
      // Wait for DOM to update then create charts
      await nextTick()
      setTimeout(() => {
        destroyCharts()
        createCharts()
      }, 100)
    } else {
      throw new Error(data.message || 'Failed to generate report')
    }
  } catch (err) {
    error.value = err.message
    notification.error(err.message)
  } finally {
    generating.value = false
  }
}

// Destroy existing charts
const destroyCharts = () => {
  if (symbolChart) {
    symbolChart.destroy()
    symbolChart = null
  }
  if (distributionChart) {
    distributionChart.destroy()
    distributionChart = null
  }
  if (trendChart) {
    trendChart.destroy()
    trendChart = null
  }
}

// Create charts
const createCharts = () => {
  if (!reportData.value.length) return
  
  try {
    createSymbolChart()
    createDistributionChart()
    createTrendChart()
  } catch (err) {
    console.error('Error creating charts:', err)
  }
}

// Create symbol bar chart
const createSymbolChart = () => {
  if (!symbolChartCanvas.value) return
  
  const ctx = symbolChartCanvas.value.getContext('2d')
  const symbols = symbolPerformance.value.map(s => s.symbol)
  const profits = symbolPerformance.value.map(s => s.netPnL)
  const backgroundColors = profits.map(p => p >= 0 ? '#10b981' : '#ef4444')
  
  symbolChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: symbols,
      datasets: [{
        label: 'Net P&L',
        data: profits,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c + '80'),
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || ''
              if (label) label += ': '
              label += formatCurrency(context.raw)
              return label
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value)
          }
        }
      }
    }
  })
}

// Create distribution pie chart
const createDistributionChart = () => {
  if (!distributionChartCanvas.value) return
  
  const ctx = distributionChartCanvas.value.getContext('2d')
  const winningSymbols = symbolPerformance.value.filter(s => s.netPnL > 0)
  const losingSymbols = symbolPerformance.value.filter(s => s.netPnL < 0)
  
  const winningTotal = winningSymbols.reduce((sum, s) => sum + s.netPnL, 0)
  const losingTotal = Math.abs(losingSymbols.reduce((sum, s) => sum + s.netPnL, 0))
  
  distributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Winning Symbols', 'Losing Symbols'],
      datasets: [{
        data: [winningTotal, losingTotal],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: ['#059669', '#dc2626'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.raw
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${label}: ${formatCurrency(value)} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// Create trend line chart
const createTrendChart = () => {
  if (!trendChartCanvas.value) return
  
  const ctx = trendChartCanvas.value.getContext('2d')
  
  // Sort by profit
  const sortedData = [...filteredReport.value].sort((a, b) => b.profit - a.profit)
  const labels = sortedData.map((_, index) => `#${index + 1}`)
  const profits = sortedData.map(d => d.profit)
  
  // Calculate cumulative
  let cumulative = 0
  const cumulativeData = sortedData.map(d => {
    cumulative += d.profit
    return cumulative
  })
  
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Individual Profit',
          data: profits,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: profits.map(p => p >= 0 ? '#10b981' : '#ef4444'),
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Cumulative Profit',
          data: cumulativeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || ''
              if (label) label += ': '
              label += formatCurrency(context.raw)
              return label
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: {
            display: true,
            text: 'Individual Profit'
          },
          ticks: {
            callback: (value) => formatCurrency(value)
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          title: {
            display: true,
            text: 'Cumulative Profit'
          },
          ticks: {
            callback: (value) => formatCurrency(value)
          }
        }
      }
    }
  })
}

// Apply filters
const applyFilters = () => {
  nextTick(() => {
    destroyCharts()
    createCharts()
  })
}

// Filtered report
const filteredReport = computed(() => {
  return reportData.value.filter(item => {
    // Symbol filter
    if (filterSymbol.value && item.symbol !== filterSymbol.value) return false
    
    // Result filter
    if (filterResult.value && item.result !== filterResult.value) return false
    
    return true
  })
})

// Unique symbols for filter
const uniqueSymbols = computed(() => {
  const symbols = new Set(reportData.value.map(item => item.symbol))
  return Array.from(symbols).sort()
})

// Wins, Losses, Draws counts
const winsCount = computed(() => filteredReport.value.filter(item => item.result === 'WIN').length)
const lossesCount = computed(() => filteredReport.value.filter(item => item.result === 'LOSS').length)
const drawsCount = computed(() => filteredReport.value.filter(item => item.result === 'DRAW').length)

// Total summary calculations
const totalSummary = computed(() => {
  const data = filteredReport.value
  
  const totalProfit = data.reduce((sum, item) => sum + item.total_profit, 0)
  const totalLoss = data.reduce((sum, item) => sum + item.total_loss, 0)
  const totalDeposit = data.reduce((sum, item) => sum + item.total_deposit, 0)
  const totalWithdrawal = data.reduce((sum, item) => sum + item.total_withdrawal, 0)
  const netPnL = totalProfit - totalLoss
  
  // Win rate calculation
  const wins = data.filter(item => item.result === 'WIN').length
  const total = data.length
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0
  
  // Average profit per trade
  const averageProfit = total > 0 ? netPnL / total : 0
  
  // Profit factor
  const profitFactor = totalLoss > 0 ? (totalProfit / totalLoss).toFixed(2) : totalProfit > 0 ? '∞' : '0'
  
  // Best and worst dates
  const bestDate = data.reduce((best, item) => {
    if (!best || item.profit > best.profit) return item
    return best
  }, null)?.most_gained_date || '-'
  
  const worstDate = data.reduce((worst, item) => {
    if (!worst || item.profit < worst.profit) return item
    return worst
  }, null)?.most_loss_date || '-'
  
  return {
    totalProfit,
    totalLoss,
    netPnL,
    totalDeposit,
    totalWithdrawal,
    winRate,
    averageProfit,
    profitFactor,
    bestDate,
    worstDate
  }
})

// Symbol performance for chart
const symbolPerformance = computed(() => {
  const symbolMap = new Map()
  
  filteredReport.value.forEach(item => {
    if (!symbolMap.has(item.symbol)) {
      symbolMap.set(item.symbol, {
        symbol: item.symbol,
        totalProfit: 0,
        totalLoss: 0,
        netPnL: 0,
        profit: item.profit
      })
    }
    
    const data = symbolMap.get(item.symbol)
    data.totalProfit += item.total_profit
    data.totalLoss += item.total_loss
    data.netPnL = data.totalProfit - data.totalLoss
  })
  
  return Array.from(symbolMap.values())
})

// Profit ranges
const profitRanges = computed(() => {
  const ranges = [
    { label: '> $1000', min: 1000, max: Infinity, count: 0, class: 'high-profit' },
    { label: '$500 - $1000', min: 500, max: 1000, count: 0, class: 'medium-profit' },
    { label: '$100 - $500', min: 100, max: 500, count: 0, class: 'low-profit' },
    { label: '$0 - $100', min: 0, max: 100, count: 0, class: 'break-even' },
    { label: '-$100 - $0', min: -100, max: 0, count: 0, class: 'low-loss' },
    { label: '-$500 - -$100', min: -500, max: -100, count: 0, class: 'medium-loss' },
    { label: '< -$500', min: -Infinity, max: -500, count: 0, class: 'high-loss' }
  ]
  
  filteredReport.value.forEach(item => {
    const profit = item.profit
    for (const range of ranges) {
      if (profit >= range.min && profit < range.max) {
        range.count++
        break
      }
    }
  })
  
  const total = filteredReport.value.length
  ranges.forEach(range => {
    range.percentage = total > 0 ? (range.count / total) * 100 : 0
  })
  
  return ranges
})

// Best and worst symbols
const bestSymbol = computed(() => {
  const best = symbolPerformance.value.reduce((best, current) => {
    if (!best || current.netPnL > best.netPnL) return current
    return best
  }, null)
  
  return best || { symbol: '-', profit: 0 }
})

const worstSymbol = computed(() => {
  const worst = symbolPerformance.value.reduce((worst, current) => {
    if (!worst || current.netPnL < worst.netPnL) return current
    return worst
  }, null)
  
  return worst || { symbol: '-', loss: 0 }
})

// Helper functions
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value)
}

const formatDate = (dateString) => {
  if (!dateString || dateString === '-') return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getProfitClass = (value) => {
  if (value > 0) return 'profit'
  if (value < 0) return 'loss'
  return ''
}

// Export to CSV
const exportToCSV = () => {
  const headers = ['Symbol', 'Currency', 'Result', 'Profit', 'Total Profit', 'Total Loss', 'Net P&L', 'Most Gained Date', 'Most Loss Date', 'Deposits', 'Withdrawals']
  
  const rows = filteredReport.value.map(item => [
    item.symbol,
    item.currency,
    item.result,
    item.profit.toFixed(4),
    item.total_profit.toFixed(4),
    item.total_loss.toFixed(4),
    (item.total_profit - item.total_loss).toFixed(4),
    item.most_gained_date,
    item.most_loss_date,
    item.total_deposit.toFixed(4),
    item.total_withdrawal.toFixed(4)
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `trading-report-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
  
  notification.success('Report exported to CSV successfully')
}

// Watch for filter changes
watch([filterSymbol, filterResult], () => {
  applyFilters()
})

// Clean up charts on unmount
onMounted(() => {
  // Optional: Auto-generate report on mount
  // generateReport()
})

// Clean up on unmount
onMounted(() => {
  return () => {
    destroyCharts()
  }
})
</script>

<style scoped>
  @import '../assets/styles/report.css'
</style>