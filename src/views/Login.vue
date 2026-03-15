<template>
  <div class="login-container">
    <!-- Full-screen GIF Background -->
    <div class="background-gif">
      <img src="../assets/raining.gif" class="gif-background" />
      <div class="overlay"></div>
    </div>

    <!-- AI Terminal Overlay (shown during authentication) -->
    <transition name="fade">
      <div v-if="showTerminal" class="terminal-overlay">
        <div class="terminal-window">
          <div class="terminal-header">
            <span class="terminal-title">BYTE INCOME SECURE TERMINAL v2.0</span>
            <div class="terminal-controls">
              <span class="terminal-dot red"></span>
              <span class="terminal-dot yellow"></span>
              <span class="terminal-dot green"></span>
            </div>
          </div>
          
          <div class="terminal-body">
            <div v-for="(line, index) in terminalLines" :key="index" class="terminal-line">
              <span class="terminal-prompt">{{ line.prompt }}</span>
              <span class="terminal-text">{{ line.text }}</span>
              <span v-if="line.blink" class="terminal-cursor">_</span>
            </div>
            
            <div class="terminal-progress" v-if="showProgress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
              </div>
              <span class="progress-text">{{ progressWidth }}%</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <div class="login-card" :class="{ 'blurred': showTerminal }">
      <!-- Logo Section -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <img src="../assets/trading.gif" width="60" alt="Logo" class="logo-gif" />
        </div>
        <h1 class="login-title">DataBae</h1>
        <p class="login-subtitle">Trading Data Management System</p>
      </div>

      <!-- Form Section -->
      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- Username -->
        <div class="form-group" :class="{ 'field-error': errors.username }">
          <label for="username" class="form-label">Username</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
            <input
              type="text"
              id="username"
              v-model="formData.username"
              @blur="validateField('username')"
              class="form-input"
              :class="{ error: errors.username }"
              placeholder="Enter Your Username"
              :disabled="showTerminal"
            />
          </div>
          <transition name="fade">
            <span v-if="errors.username" class="error-message">
              <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ errors.username }}
            </span>
          </transition>
        </div>

        <!-- Password -->
        <div class="form-group" :class="{ 'field-error': errors.password }">
          <label for="password" class="form-label">Password</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="formData.password"
              @blur="validateField('password')"
              class="form-input"
              :class="{ error: errors.password }"
              placeholder="Enter your password"
              :disabled="showTerminal"
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :disabled="showTerminal"
            >
              <svg v-if="!showPassword" class="toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            </button>
          </div>
          <transition name="fade">
            <span v-if="errors.password" class="error-message">
              <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ errors.password }}
            </span>
          </transition>
        </div>

        <!-- Options -->
        <div class="form-options">
          <label class="checkbox-wrapper">
            <input type="checkbox" v-model="formData.rememberMe" class="checkbox-input" :disabled="showTerminal" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">Keep me signed in</span>
          </label>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="submit-button"
          :disabled="isLoading || !isFormValid || showTerminal"
        >
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>Sign In</span>
          <svg v-if="!isLoading" class="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </form>

      <!-- Error Alert -->
      <transition name="slide">
        <div v-if="loginError" class="error-alert">
          <svg class="alert-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          {{ loginError }}
        </div>
      </transition>

      <!-- Footer -->
      <div class="login-footer">
        <p class="help-text">
          Contact admin for your onboarding
        </p>
      </div>
    </div>
  </div>

  <LoadingOverlay :visible="isRedirecting" message="Redirecting to dashboard..." />
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import LoadingOverlay from '../components/LoadingOverlay.vue'

const router = useRouter()
const isRedirecting = ref(false)
const loginError = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const showTerminal = ref(false)
const showProgress = ref(false)
const progressWidth = ref(0)
const terminalLines = ref([])

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Viewport height management
const setVH = () => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

onMounted(() => {
  setVH()
  window.addEventListener('resize', setVH)
})

onUnmounted(() => {
  window.removeEventListener('resize', setVH)
})

const formData = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  username: '',
  password: ''
})

const validateUsername = (username) => {
  if (!username) return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters'
  return ''
}

const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  return ''
}

const validateField = (field) => {
  if (field === 'username') errors.username = validateUsername(formData.username)
  else if (field === 'password') errors.password = validatePassword(formData.password)
}

const validateForm = () => {
  errors.username = validateUsername(formData.username)
  errors.password = validatePassword(formData.password)
  return !errors.username && !errors.password
}

const isFormValid = computed(() => formData.username && formData.password && !errors.username && !errors.password)

const loginUser = async (credentials) => {
  try {
    const response = await fetch(API_BASE_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(credentials)
    })
    const data = await response.json()
    if (!response.ok || data.code !== '200') throw new Error(data.message || 'Login failed')
    return data.data
  } catch (err) {
    throw err
  }
}

// AI Terminal Animation
const addTerminalLine = (prompt, text, blink = false) => {
  terminalLines.value.push({ prompt, text, blink })
}

const clearTerminal = () => {
  terminalLines.value = []
}

const startAISequence = async () => {
  showTerminal.value = true
  clearTerminal()
  
  // Initializing sequence
  addTerminalLine('>', 'INITIALIZING SECURE CONNECTION...')
  await new Promise(resolve => setTimeout(resolve, 800))
  
  addTerminalLine('>', 'ESTABLISHING ENCRYPTED TUNNEL...')
  await new Promise(resolve => setTimeout(resolve, 600))
  
  addTerminalLine('>', 'VERIFYING CREDENTIALS...')
  await new Promise(resolve => setTimeout(resolve, 500))
  
  addTerminalLine('>', `AUTHENTICATING USER: ${formData.username.toUpperCase()}`, true)
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Show progress bar
  showProgress.value = true
  
  // Progress animation
  for (let i = 0; i <= 100; i += 5) {
    progressWidth.value = i
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  addTerminalLine('✓', 'BIOMETRIC SCAN COMPLETE')
  await new Promise(resolve => setTimeout(resolve, 400))
  
  addTerminalLine('✓', 'TOKEN GENERATED: 0x' + Math.random().toString(36).substring(2, 15).toUpperCase())
  await new Promise(resolve => setTimeout(resolve, 400))
  
  addTerminalLine('✓', 'SESSION ESTABLISHED')
  await new Promise(resolve => setTimeout(resolve, 400))
  
  addTerminalLine('✓', 'ACCESS GRANTED - WELCOME TO BYTE INCOME')
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Hide terminal and redirect
  showTerminal.value = false
  showProgress.value = false
  
  isRedirecting.value = true
  setTimeout(() => router.push('/overview'), 1000)
}

const handleSubmit = async () => {
  if (!validateForm()) return
  isLoading.value = true
  loginError.value = ''

  try {
    const data = await loginUser({ username: formData.username, password: formData.password })
    
    // Store credentials
    localStorage.setItem('authToken', data.token)
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userData', JSON.stringify({ username: data.username }))
    if (formData.rememberMe) localStorage.setItem('rememberMe', 'true')
    else localStorage.removeItem('rememberMe')
    
    // Start AI terminal sequence
    isLoading.value = false
    await startAISequence()
    
  } catch (err) {
    loginError.value = err.message || 'Login failed. Please try again.'
    isLoading.value = false
    
    // Show error in terminal
    showTerminal.value = true
    clearTerminal()
    addTerminalLine('!', 'AUTHENTICATION FAILED')
    addTerminalLine('>', `ERROR: ${err.message || 'Invalid credentials'}`)
    addTerminalLine('>', 'PLEASE TRY AGAIN')
    
    setTimeout(() => {
      showTerminal.value = false
    }, 3000)
  }
}
</script>

<style scoped>
  @import '../assets/styles/login.css';
</style>