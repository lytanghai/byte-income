<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">Welcome Back</h2>
      <p class="login-subtitle">Sign in to your account</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- Username -->
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            type="text"
            id="username"
            v-model="formData.username"
            @blur="validateField('username')"
            class="form-input"
            :class="{ error: errors.username }"
            placeholder="Enter your username"
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="formData.password"
              @blur="validateField('password')"
              class="form-input"
              :class="{ error: errors.password }"
              placeholder="Enter your password"
            />
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
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

        <!-- Submit -->
        <button
          type="submit"
          class="submit-button"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Error -->
      <div v-if="loginError" class="error-alert">
        {{ loginError }}
      </div>

      <!-- Info -->
      <div class="demo-credentials">
        <p>Contact Admin for access</p>
      </div>
    </div>
  </div>

  <LoadingOverlay :visible="isRedirecting" message="Redirecting to dashboard..." />
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import LoadingOverlay from '../components/LoadingOverlay.vue'

const router = useRouter()
const isRedirecting = ref(false)
const loginError = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

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
    const response = await fetch('http://localhost:8080/kark-profit/auth/login', {
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
/* Container */
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1e293b; /* dark-blue background */
  padding: 1rem;
}

/* Card */
.login-card {
  background: #111827; /* darker card */
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 420px;
  color: #f3f4f6;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  transition: transform 0.3s;
}
.login-card:hover { transform: translateY(-3px); }

/* Titles */
.login-title { font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 0.5rem; }
.login-subtitle { font-size: 1rem; text-align: center; margin-bottom: 2rem; color: #cbd5e1; }

/* Form */
.login-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-label { font-weight: 600; font-size: 0.9rem; }
.form-input {
  padding: 0.8rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #374151;
  background: #1f2937;
  color: #f3f4f6;
  font-size: 1rem;
}
.form-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.3); }
.form-input.error { border-color: #f87171; }
.error-message { color: #f87171; font-size: 0.85rem; }

/* Password */
.password-wrapper { position: relative; }
.password-toggle {
  position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #3b82f6; cursor: pointer; font-weight: 600;
}

/* Checkbox */
.form-options { display: flex; align-items: center; gap: 0.5rem; color: #cbd5e1; }
.checkbox-label input { cursor: pointer; width: 1rem; height: 1rem; }

/* Submit Button */
.submit-button {
  padding: 0.85rem; font-size: 1rem; font-weight: 600; border-radius: 0.5rem;
  background: #3b82f6; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 0.5rem; transition: all 0.2s;
}
.submit-button:hover:not(:disabled) { background: #2563eb; transform: translateY(-2px); }
.submit-button:disabled { opacity: 0.6; cursor: not-allowed; }

/* Spinner */
.spinner {
  width: 1.2rem; height: 1.2rem; border: 3px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Error alert */
.error-alert {
  margin-top: 1rem; padding: 0.75rem; border-radius: 0.5rem;
  background: #b91c1c; color: #fff; font-size: 0.875rem; text-align: center;
}

/* Info */
.demo-credentials { margin-top: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.875rem; }

/* Responsive */
@media (max-width: 480px) {
  .login-card { padding: 1.5rem; max-width: 90%; }
  .login-title { font-size: 1.5rem; }
  .login-subtitle { font-size: 0.9rem; }
  .form-input { font-size: 0.95rem; padding: 0.65rem 0.9rem; }
  .submit-button { font-size: 0.95rem; padding: 0.7rem; }
}
</style>