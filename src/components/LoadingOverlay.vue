<template>
  <transition name="fade-scale" mode="out-in">
    <div v-if="visible" class="loading-overlay" :class="{ 'light': theme === 'light', 'dark': theme === 'dark' }">
      <div class="loading-container">
        <!-- Animated Background -->
        <div class="loading-background">
          <div class="bg-shape shape-1"></div>
          <div class="bg-shape shape-2"></div>
          <div class="bg-shape shape-3"></div>
        </div>
        
        <!-- Main Spinner -->
        <div class="loading-spinner" :class="{ 'pulse': type === 'pulse' }">
          <!-- Animated Rings -->
          <div class="spinner-ring ring-outer"></div>
          <div class="spinner-ring ring-middle"></div>
          <div class="spinner-ring ring-inner"></div>
          
          <!-- Icon or Logo -->
          <div class="spinner-icon" v-if="type === 'logo'">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 15C6 16.6569 4.65685 18 3 18C1.34315 18 0 16.6569 0 15C0 13.3431 1.34315 12 3 12H6V15Z" fill="currentColor"/>
              <path d="M8 15C8 13.3431 9.34315 12 11 12C12.6569 12 14 13.3431 14 15V21C14 22.6569 12.6569 24 11 24C9.34315 24 8 22.6569 8 21V15Z" fill="currentColor"/>
              <path d="M11 6C9.34315 6 8 4.65685 8 3C8 1.34315 9.34315 0 11 0C12.6569 0 14 1.34315 14 3V6H11Z" fill="currentColor"/>
              <path d="M11 8C12.6569 8 14 9.34315 14 11C14 12.6569 12.6569 14 11 14H5C3.34315 14 2 12.6569 2 11C2 9.34315 3.34315 8 5 8H11Z" fill="currentColor"/>
            </svg>
          </div>
          
          <!-- Animated Dots for type="dots" -->
          <div class="dots-container" v-if="type === 'dots'">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          
          <!-- Progress Bar for type="progress" -->
          <div class="progress-container" v-if="type === 'progress'">
            <div class="progress-bar" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
        
        <!-- Message with Animation -->
        <div class="loading-message" :class="{ 'has-subtitle': subtitle }">
          <h3 class="loading-title">{{ message }}</h3>
          <p v-if="subtitle" class="loading-subtitle">{{ subtitle }}</p>
        </div>
        
        <!-- Progress Percentage -->
        <div v-if="showPercentage && progress" class="progress-percentage">
          {{ progress }}%
        </div>
        
        <!-- Cancel Button (optional) -->
        <button 
          v-if="cancellable" 
          class="cancel-button"
          @click="$emit('cancel')"
          :disabled="isCancelling"
        >
          <span>{{ isCancelling ? 'Cancelling...' : 'Cancel' }}</span>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: 'Loading...'
  },
  subtitle: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'light', // 'light' or 'dark'
    validator: (value) => ['light', 'dark'].includes(value)
  },
  type: {
    type: String,
    default: 'spinner', // 'spinner', 'pulse', 'dots', 'logo', 'progress'
    validator: (value) => ['spinner', 'pulse', 'dots', 'logo', 'progress'].includes(value)
  },
  progress: {
    type: Number,
    default: 0
  },
  showPercentage: {
    type: Boolean,
    default: false
  },
  cancellable: {
    type: Boolean,
    default: false
  },
  timeout: {
    type: Number,
    default: 0 // Auto-hide after timeout (ms), 0 = no timeout
  }
})

const emit = defineEmits(['cancel', 'timeout'])
const isCancelling = ref(false)

// Handle timeout
if (props.timeout > 0) {
  watch(() => props.visible, (newVal) => {
    if (newVal) {
      setTimeout(() => {
        if (props.visible) {
          emit('timeout')
        }
      }, props.timeout)
    }
  })
}
</script>

<style scoped>
/* Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* Theme variations */
.loading-overlay.light {
  background: rgba(255, 255, 255, 0.85);
}

.loading-overlay.dark {
  background: rgba(0, 0, 0, 0.85);
}

.loading-overlay.dark .loading-title {
  color: #ffffff;
}

.loading-overlay.dark .loading-subtitle {
  color: rgba(255, 255, 255, 0.7);
}

/* Container */
.loading-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(1.5rem, 5vw, 3rem);
  border-radius: 2rem;
  background: var(--container-bg, transparent);
  max-width: min(90%, 400px);
  width: 100%;
}

/* Animated Background */
.loading-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: 2rem;
  pointer-events: none;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: min(200px, 40vw);
  height: min(200px, 40vw);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -50px;
  right: -50px;
  opacity: 0.3;
  animation-delay: 0s;
}

.shape-2 {
  width: min(150px, 30vw);
  height: min(150px, 30vw);
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -30px;
  left: -30px;
  opacity: 0.2;
  animation-delay: 2s;
}

.shape-3 {
  width: min(100px, 20vw);
  height: min(100px, 20vw);
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.15;
  animation-delay: 4s;
}

/* Loading Spinner */
.loading-spinner {
  position: relative;
  width: min(120px, 25vw);
  height: min(120px, 25vw);
  margin-bottom: clamp(1rem, 3vh, 2rem);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animated Rings */
.spinner-ring {
  position: absolute;
  border-radius: 50%;
  border-style: solid;
  animation: spin var(--duration) linear infinite;
}

.ring-outer {
  width: 100%;
  height: 100%;
  border-width: clamp(3px, 0.5vw, 4px);
  border-color: transparent;
  border-top-color: #667eea;
  border-right-color: rgba(102, 126, 234, 0.3);
  border-bottom-color: rgba(102, 126, 234, 0.1);
  border-left-color: rgba(102, 126, 234, 0.5);
  --duration: 1.5s;
}

.ring-middle {
  width: 75%;
  height: 75%;
  border-width: clamp(3px, 0.5vw, 4px);
  border-color: transparent;
  border-top-color: #764ba2;
  border-left-color: rgba(118, 75, 162, 0.3);
  border-right-color: rgba(118, 75, 162, 0.5);
  --duration: 2s;
  animation-direction: reverse;
}

.ring-inner {
  width: 50%;
  height: 50%;
  border-width: clamp(3px, 0.5vw, 4px);
  border-color: transparent;
  border-top-color: #f093fb;
  border-bottom-color: rgba(240, 147, 251, 0.3);
  border-left-color: rgba(240, 147, 251, 0.5);
  --duration: 2.5s;
}

/* Pulse Animation */
.loading-spinner.pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Logo Icon */
.spinner-icon {
  width: 40%;
  height: 40%;
  color: #667eea;
  animation: bounce 2s ease-in-out infinite;
}

.loading-overlay.dark .spinner-icon {
  color: #ffffff;
}

/* Dots Container */
.dots-container {
  display: flex;
  gap: clamp(0.5rem, 1vw, 0.8rem);
  align-items: center;
  justify-content: center;
}

.dot {
  width: clamp(0.8rem, 2vw, 1rem);
  height: clamp(0.8rem, 2vw, 1rem);
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: dotPulse 1.5s ease-in-out infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
.dot:nth-child(4) { animation-delay: 0.6s; }

/* Progress Bar */
.progress-container {
  width: 100%;
  height: clamp(4px, 1vh, 6px);
  background: rgba(102, 126, 234, 0.2);
  border-radius: 1rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 1rem;
  transition: width 0.3s ease;
  animation: shimmer 2s infinite;
}

/* Progress Percentage */
.progress-percentage {
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  animation: pulse 2s ease-in-out infinite;
}

/* Message Styles */
.loading-message {
  text-align: center;
  margin-bottom: clamp(0.5rem, 2vh, 1rem);
}

.loading-title {
  font-size: clamp(1rem, 4vw, 1.25rem);
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.loading-subtitle {
  font-size: clamp(0.85rem, 3vw, 1rem);
  color: #666;
  margin: 0.5rem 0 0;
  opacity: 0.8;
}

/* Cancel Button */
.cancel-button {
  margin-top: clamp(1rem, 3vh, 1.5rem);
  padding: clamp(0.6rem, 2vh, 0.8rem) clamp(1.5rem, 4vw, 2rem);
  border: 2px solid #667eea;
  border-radius: 2rem;
  background: transparent;
  color: #667eea;
  font-size: clamp(0.9rem, 3vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.cancel-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.cancel-button:hover:not(:disabled)::before {
  width: 300px;
  height: 300px;
}

.cancel-button:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
}

.cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(10px, -10px); }
  50% { transform: translate(-5px, 15px); }
  75% { transform: translate(-15px, -5px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Fade Scale Transition */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Responsive Design */
@media (max-width: 480px) {
  .loading-container {
    padding: 1.5rem;
  }
  
  .loading-spinner {
    width: 80px;
    height: 80px;
  }
  
  .loading-title {
    font-size: 1rem;
  }
  
  .loading-subtitle {
    font-size: 0.85rem;
  }
}

@media (min-width: 1200px) {
  .loading-spinner {
    width: 150px;
    height: 150px;
  }
  
  .loading-title {
    font-size: 1.5rem;
  }
}

/* Landscape Mode */
@media (max-height: 600px) and (orientation: landscape) {
  .loading-container {
    flex-direction: row;
    gap: 2rem;
    padding: 1rem 2rem;
  }
  
  .loading-spinner {
    width: 60px;
    height: 60px;
    margin-bottom: 0;
  }
  
  .loading-message {
    text-align: left;
    margin-bottom: 0;
  }
  
  .cancel-button {
    margin-top: 0;
    margin-left: 1rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .loading-overlay:not(.light):not(.dark) {
    background: rgba(0, 0, 0, 0.85);
  }
  
  .loading-overlay:not(.light):not(.dark) .loading-title {
    color: #ffffff;
  }
  
  .loading-overlay:not(.light):not(.dark) .loading-subtitle {
    color: rgba(255, 255, 255, 0.7);
  }
}
</style>