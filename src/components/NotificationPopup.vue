<template>
  <Transition :name="transitionName">
    <div v-if="visible" class="notification-popup" :class="[type, position]">
      <div class="notification-content">
        <span class="notification-icon">{{ icons[type] }}</span>
        <span class="notification-message">{{ message }}</span>
        <button v-if="showClose" class="notification-close" @click="close">✕</button>
      </div>
      
      <!-- Progress bar for auto-dismiss -->
      <div v-if="autoDismiss && duration > 0" 
           class="notification-progress"
           :style="{ animationDuration: duration + 'ms' }"
           @animationend="handleProgressEnd">
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  // Control visibility
  modelValue: {
    type: Boolean,
    default: false
  },
  // Notification type: success, error, warning, info
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  // Message to display
  message: {
    type: String,
    default: ''
  },
  // Duration in milliseconds (0 = no auto-dismiss)
  duration: {
    type: Number,
    default: 3000
  },
  // Position on screen
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'].includes(value)
  },
  // Show close button
  showClose: {
    type: Boolean,
    default: true
  },
  // Auto dismiss
  autoDismiss: {
    type: Boolean,
    default: true
  },
  // Transition animation
  transitionName: {
    type: String,
    default: 'slide-fade'
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

// Icons for different types
const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
}

// Internal visibility state
const visible = ref(props.modelValue)
let timeoutId = null

// Watch for prop changes
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal && props.autoDismiss && props.duration > 0) {
    startTimer()
  }
})

// Methods
const startTimer = () => {
  if (timeoutId) clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    close()
  }, props.duration)
}

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

const handleProgressEnd = () => {
  // Progress bar animation completed
  if (props.autoDismiss) {
    close()
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})

// Expose methods for parent component
defineExpose({
  close,
  show: () => { visible.value = true }
})
</script>

<style scoped>
.notification-popup {
  position: fixed;
  z-index: 9999;
  max-width: 400px;
  min-width: 300px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  pointer-events: auto;
}

/* Position variants */
.notification-popup.top-right {
  top: 20px;
  right: 20px;
}

.notification-popup.top-left {
  top: 20px;
  left: 20px;
}

.notification-popup.bottom-right {
  bottom: 20px;
  right: 20px;
}

.notification-popup.bottom-left {
  bottom: 20px;
  left: 20px;
}

.notification-popup.top-center {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.notification-popup.bottom-center {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

/* Type variants */
.notification-popup.success {
  background: #10b981;
  color: white;
}

.notification-popup.error {
  background: #ef4444;
  color: white;
}

.notification-popup.warning {
  background: #f59e0b;
  color: white;
}

.notification-popup.info {
  background: #3b82f6;
  color: white;
}

.notification-content {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.notification-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  opacity: 0.8;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  opacity: 1;
}

/* Progress bar */
.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.5);
  width: 100%;
  transform-origin: left;
  animation: progress linear forwards;
}

@keyframes progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}

/* Position-specific animations */
.top-right.slide-fade-enter-from,
.top-right.slide-fade-leave-to {
  transform: translateX(20px);
}

.top-left.slide-fade-enter-from,
.top-left.slide-fade-leave-to {
  transform: translateX(-20px);
}

.bottom-right.slide-fade-enter-from,
.bottom-right.slide-fade-leave-to {
  transform: translateX(20px);
}

.bottom-left.slide-fade-enter-from,
.bottom-left.slide-fade-leave-to {
  transform: translateX(-20px);
}

.top-center.slide-fade-enter-from,
.top-center.slide-fade-leave-to,
.bottom-center.slide-fade-enter-from,
.bottom-center.slide-fade-leave-to {
  transform: translate(-50%, -20px);
}

.bottom-center.slide-fade-enter-from,
.bottom-center.slide-fade-leave-to {
  transform: translate(-50%, 20px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .notification-popup {
    max-width: none;
    min-width: auto;
    left: 10px;
    right: 10px;
  }
  
  .notification-popup.top-right,
  .notification-popup.top-left,
  .notification-popup.bottom-right,
  .notification-popup.bottom-left,
  .notification-popup.top-center,
  .notification-popup.bottom-center {
    left: 10px;
    right: 10px;
    transform: none;
    width: calc(100% - 20px);
  }
  
  .notification-popup.top-right,
  .notification-popup.top-left,
  .notification-popup.top-center {
    top: 10px;
  }
  
  .notification-popup.bottom-right,
  .notification-popup.bottom-left,
  .notification-popup.bottom-center {
    bottom: 10px;
  }
  
  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(-20px) !important;
  }
  
  .bottom-right.slide-fade-enter-from,
  .bottom-right.slide-fade-leave-to,
  .bottom-left.slide-fade-enter-from,
  .bottom-left.slide-fade-leave-to,
  .bottom-center.slide-fade-enter-from,
  .bottom-center.slide-fade-leave-to {
    transform: translateY(20px) !important;
  }
}
</style>