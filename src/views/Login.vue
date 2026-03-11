<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">Welcome Back</h2>
      <p class="login-subtitle">Please sign in to your account</p>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- Username Field -->
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            type="text"
            id="username"
            v-model="formData.username"
            @blur="validateField('username')"
            class="form-input"
            :class="{ 'error': errors.username }"
            placeholder="Enter your username"
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="password-input-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="formData.password"
              @blur="validateField('password')"
              class="form-input"
              :class="{ 'error': errors.password }"
              placeholder="Enter your password"
            />
            <button 
              type="button"
              class="password-toggle"
              @click="togglePassword"
            >
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <!-- Remember Me -->
        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="formData.rememberMe" />
            <span>Remember me</span>
          </label>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="submit-button"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Error Message Display -->
      <div v-if="loginError" class="error-alert">
        {{ loginError }}
      </div>

      <!-- Demo credentials (for testing) -->
      <div class="demo-credentials">
        <p class="demo-title">Contact Admin For User Onboard</p>
      </div>
    </div>
  </div>
  <LoadingOverlay :visible="isRedirecting" message="Redirecting to dashboard..." />
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import LoadingOverlay from '../components/LoadingOverlay.vue'  // Fixed import path

const isRedirecting = ref(false)
const router = useRouter()
const loginError = ref('')

// Form data
const formData = reactive({
  username: '',
  password: '',
  rememberMe: false
})

// Error handling
const errors = reactive({
  username: '',
  password: ''
})

// UI state
const showPassword = ref(false)
const isLoading = ref(false)

// Validation rules
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

// Validate specific field
const validateField = (field) => {
  if (field === 'username') {
    errors.username = validateUsername(formData.username)
  } else if (field === 'password') {
    errors.password = validatePassword(formData.password)
  }
}

// Validate all fields
const validateForm = () => {
  errors.username = validateUsername(formData.username)
  errors.password = validatePassword(formData.password)
  return !errors.username && !errors.password
}

// Check if form is valid
const isFormValid = computed(() => {
  return formData.username && formData.password && !errors.username && !errors.password
})

// Toggle password visibility
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// API call function
const loginUser = async (credentials) => {
  try {
    // For testing - remove this and use your real API
    // This simulates a successful login for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Uncomment this for real API
    /*
    const response = await fetch('https://your-api-domain.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }

    return data
    */
    
    // Demo response - remove this when using real API
    return {
      token: 'demo-token-123',
      user: {
        username: credentials.username,
        name: 'John Doe'
      }
    }
  } catch (error) {
    throw error
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  loginError.value = ''
  
  try {
    const response = await loginUser({
      username: formData.username,
      password: formData.password,
      rememberMe: formData.rememberMe
    })

    // Store the token
    localStorage.setItem('authToken', response.token)
    localStorage.setItem('isAuthenticated', 'true')
    
    if (response.user) {
      localStorage.setItem('userData', JSON.stringify(response.user))
    }

    if (formData.rememberMe) {
      localStorage.setItem('rememberMe', 'true')
    }

    // Show redirecting overlay
    isRedirecting.value = true

    // Redirect after a small delay
    setTimeout(() => {
      router.push('/overview')
    }, 1000)

  } catch (error) {
    console.error('Login failed:', error)
    loginError.value = error.message || 'Login failed. Please try again.'
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
  text-align: center;
}

.login-subtitle {
  color: #666;
  text-align: center;
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #f56565;
}

.error-message {
  color: #f56565;
  font-size: 0.875rem;
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.password-toggle:hover {
  text-decoration: underline;
}

.form-options {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.875rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 1.2rem;
  height: 1.2rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.demo-credentials {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  text-align: center;
  font-size: 0.875rem;
  color: #666;
}

.demo-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.error-alert {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
}
</style>