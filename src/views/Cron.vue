<template>
  <div class="scheduler-card">
    <div class="card-header">
      <div class="user-info">
        <span class="avatar">👤</span>
        <span class="username">@tanghai.ly</span>
      </div>
      <h3>API Scheduler (Every 12 Minutes)</h3>
    </div>
    
    <!-- Status Dashboard -->
    <div class="dashboard">
      <div class="status-row">
        <div class="status-item">
          <span class="label">Status:</span>
          <span class="value" :class="{'status-active': isActive, 'status-paused': !isActive}">
            {{ isActive ? '🟢 Active' : '🔴 Paused' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">User:</span>
          <span class="value user-highlight">tanghai.ly</span>
        </div>
      </div>
      
      <div class="status-row">
        <div class="status-item">
          <span class="label">Last API Call:</span>
          <span class="value">{{ lastCallFormatted }}</span>
        </div>
        <div class="status-item">
          <span class="label">Next Call:</span>
          <span class="value countdown">{{ countdownText }}</span>
        </div>
      </div>
      
      <div class="status-row">
        <div class="status-item">
          <span class="label">Total Calls Today:</span>
          <span class="value">{{ totalCallsToday }}</span>
        </div>
        <div class="status-item">
          <span class="label">Status:</span>
          <span class="value" :class="{'loading': isLoading}">
            {{ isLoading ? '⏳ Processing...' : '✅ Ready' }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="progress-section">
      <div class="progress-label">
        <span>Next call in:</span>
        <span class="progress-time">{{ formatTime(secondsRemaining) }}</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>
    
    <!-- Control Buttons -->
    <div class="controls">
      <button 
        @click="callApiNow" 
        :disabled="isLoading"
        class="btn btn-primary"
      >
        <span class="btn-icon">📞</span>
        {{ isLoading ? 'Calling...' : 'Call API Now' }}
      </button>
      
      <button 
        @click="toggleScheduler" 
        :class="['btn', isActive ? 'btn-warning' : 'btn-success']"
      >
        <span class="btn-icon">{{ isActive ? '⏸️' : '▶️' }}</span>
        {{ isActive ? 'Pause' : 'Resume' }}
      </button>
      
      <button 
        @click="resetScheduler" 
        class="btn btn-secondary"
        :disabled="!isActive && secondsRemaining === 720"
      >
        <span class="btn-icon">🔄</span>
        Reset
      </button>
    </div>
    
    <!-- Response Log -->
    <div class="response-log" v-if="responses.length > 0">
      <div class="log-header">
        <span>📋 Recent API Responses</span>
        <button @click="clearLogs" class="clear-btn">Clear</button>
      </div>
      <div class="log-entries">
        <div v-for="(response, index) in responses" :key="index" class="log-entry">
          <span class="log-time">{{ response.time }}</span>
          <span class="log-status" :class="{'success': response.success, 'error': !response.success}">
            {{ response.success ? '✅' : '❌' }}
          </span>
          <span class="log-message">{{ response.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useIntervalFn, useNow } from '@vueuse/core'

// User-specific configuration
const USERNAME = 'tanghai.ly'
const API_URL =  import.meta.env.VITE_API_CRON_URL // Replace with your actual API

// State
const lastCall = ref(null)
const isLoading = ref(false)
const isActive = ref(true)
const responses = ref([])
const totalCallsToday = ref(0)
const secondsRemaining = ref(720) // 12 minutes in seconds
const INTERVAL_SECONDS = 720 // 12 * 60

// Timer reference
let countdownInterval = null

// Get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    notification.error('Please login first')
    throw new Error('No authentication token')
  }
  return token
}

// API Call function
const callApi = async () => {
  if (!isActive.value) return
  
  isLoading.value = true
  const callTime = new Date()
  
  try {
    const token = getAuthToken()
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    // Add to responses log
    responses.value.unshift({
      time: formatTimeOnly(callTime),
      success: true,
      message: `API call successful`
    })
    
    totalCallsToday.value++
    lastCall.value = callTime
    
    console.log(`[${USERNAME}] API Response:`, data)
    
  } catch (error) {
    console.error(`[${USERNAME}] API Error:`, error)
    
    responses.value.unshift({
      time: formatTimeOnly(callTime),
      success: false,
      message: error.message
    })
  } finally {
    isLoading.value = false
    secondsRemaining.value = INTERVAL_SECONDS
    
    // Keep only last 10 responses
    if (responses.value.length > 10) {
      responses.value = responses.value.slice(0, 10)
    }
  }
}

// Set up interval to call every 12 minutes
const { pause, resume } = useIntervalFn(
  callApi,
  INTERVAL_SECONDS * 1000,
  { immediateCallback: true }
)

// Countdown timer
const startCountdown = () => {
  if (countdownInterval) clearInterval(countdownInterval)
  
  countdownInterval = setInterval(() => {
    if (isActive.value && secondsRemaining.value > 0) {
      secondsRemaining.value -= 1
    } else if (secondsRemaining.value <= 0) {
      secondsRemaining.value = INTERVAL_SECONDS
    }
  }, 1000)
}

// Computed properties
const lastCallFormatted = computed(() => {
  if (!lastCall.value) return 'Never'
  return formatDateTime(lastCall.value)
})

const countdownText = computed(() => {
  if (!isActive.value) return 'Paused'
  return formatTime(secondsRemaining.value)
})

const progressPercentage = computed(() => {
  return ((INTERVAL_SECONDS - secondsRemaining.value) / INTERVAL_SECONDS) * 100
})

// Methods
const callApiNow = () => {
  secondsRemaining.value = INTERVAL_SECONDS
  callApi()
}

const toggleScheduler = () => {
  isActive.value = !isActive.value
  
  if (isActive.value) {
    resume()
    secondsRemaining.value = INTERVAL_SECONDS
  } else {
    pause()
  }
}

const resetScheduler = () => {
  secondsRemaining.value = INTERVAL_SECONDS
  if (!isActive.value) {
    isActive.value = true
    resume()
  }
}

const clearLogs = () => {
  responses.value = []
}

// Helper functions
const formatTimeOnly = (date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  })
}

const formatDateTime = (date) => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Lifecycle
onMounted(() => {
  startCountdown()
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  pause()
})
</script>

<style scoped>
.scheduler-card {
  max-width: 600px;
  margin: 30px auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.avatar {
  font-size: 24px;
}

.username {
  font-size: 18px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 400;
  opacity: 0.9;
}

.dashboard {
  padding: 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.status-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-item {
  flex: 1;
}

.label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 4px;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.user-highlight {
  color: #667eea;
  background: #e0e7ff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.status-active {
  color: #10b981;
}

.status-paused {
  color: #f59e0b;
}

.countdown {
  font-family: 'Courier New', monospace;
  font-size: 20px;
  color: #3b82f6;
}

.loading {
  color: #f59e0b;
}

.progress-section {
  padding: 15px 20px;
  background: white;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #64748b;
}

.progress-time {
  font-weight: 600;
  color: #1e293b;
}

.progress-bar-container {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 1s linear;
  border-radius: 4px;
}

.controls {
  display: flex;
  gap: 10px;
  padding: 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-secondary {
  background: #64748b;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #475569;
}

.btn-icon {
  font-size: 16px;
}

.response-log {
  margin: 0 20px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #334155;
}

.clear-btn {
  padding: 4px 10px;
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
  font-size: 12px;
}

.clear-btn:hover {
  background: #e2e8f0;
}

.log-entries {
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #64748b;
  font-family: 'Courier New', monospace;
  min-width: 70px;
}

.log-status {
  font-size: 14px;
  min-width: 20px;
}

.log-message {
  color: #334155;
  flex: 1;
}

.success {
  color: #10b981;
}

.error {
  color: #ef4444;
}
</style>