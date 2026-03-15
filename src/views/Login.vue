<template>
  <div class="login-container">
    <!-- Background Pattern -->
    <div class="background-pattern">
      <div class="pattern-circle circle-1"></div>
      <div class="pattern-circle circle-2"></div>
      <div class="pattern-circle circle-3"></div>
    </div>

    <div class="login-card">
      <!-- Logo Section -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 15C6 16.6569 4.65685 18 3 18C1.34315 18 0 16.6569 0 15C0 13.3431 1.34315 12 3 12H6V15Z" fill="currentColor"/>
            <path d="M8 15C8 13.3431 9.34315 12 11 12C12.6569 12 14 13.3431 14 15V21C14 22.6569 12.6569 24 11 24C9.34315 24 8 22.6569 8 21V15Z" fill="currentColor"/>
            <path d="M11 6C9.34315 6 8 4.65685 8 3C8 1.34315 9.34315 0 11 0C12.6569 0 14 1.34315 14 3V6H11Z" fill="currentColor"/>
            <path d="M11 8C12.6569 8 14 9.34315 14 11C14 12.6569 12.6569 14 11 14H5C3.34315 14 2 12.6569 2 11C2 9.34315 3.34315 8 5 8H11Z" fill="currentColor"/>
            <path d="M18 9C18 7.34315 19.3431 6 21 6C22.6569 6 24 7.34315 24 9C24 10.6569 22.6569 12 21 12H18V9Z" fill="currentColor"/>
            <path d="M16 9C16 10.6569 14.6569 12 13 12C11.3431 12 10 10.6569 10 9V3C10 1.34315 11.3431 0 13 0C14.6569 0 16 1.34315 16 3V9Z" fill="currentColor"/>
            <path d="M13 18C14.6569 18 16 19.3431 16 21C16 22.6569 14.6569 24 13 24C11.3431 24 10 22.6569 10 21V18H13Z" fill="currentColor"/>
            <path d="M13 16C11.3431 16 10 14.6569 10 13C10 11.3431 11.3431 10 13 10H19C20.6569 10 22 11.3431 22 13C22 14.6569 20.6569 16 19 16H13Z" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="login-title">Sign in to Portal Management</h1>
        <p class="login-subtitle">Enter your credentials to access your account</p>
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
              placeholder="e.g., johndoe"
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
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
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
            <input type="checkbox" v-model="formData.rememberMe" class="checkbox-input" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">Keep me signed in</span>
          </label>
          <!-- <a href="#" class="forgot-link">Forgot password?</a> -->
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="submit-button"
          :disabled="isLoading || !isFormValid"
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
        <!-- <div class="divider">
          <span class="divider-text">New to our platform?</span>
        </div>
        <button class="signup-button">
          Create an account
          <svg class="signup-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button> -->
        <p class="help-text">
          <!-- Need help? <a href="#" class="help-link">Contact admin for your onboarding</a> -->
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

const handleSubmit = async () => {
  if (!validateForm()) return
  isLoading.value = true
  loginError.value = ''

  try {
    const data = await loginUser({ username: formData.username, password: formData.password })
    localStorage.setItem('authToken', data.token)
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userData', JSON.stringify({ username: data.username }))
    if (formData.rememberMe) localStorage.setItem('rememberMe', 'true')
    else localStorage.removeItem('rememberMe')

    isRedirecting.value = true
    setTimeout(() => router.push('/overview'), 1000)
  } catch (err) {
    loginError.value = err.message || 'Login failed. Please try again.'
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Reset any potential scrolling */
  @import '../assets/styles/login.css';
</style>