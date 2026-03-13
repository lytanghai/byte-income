import { ref } from 'vue'

// Global notification state
const notificationState = ref({
  visible: false,
  type: 'info',
  message: '',
  duration: 3000,
  position: 'top-right',
  showClose: true,
  autoDismiss: true
})

let timeoutId = null

export function useNotification() {
  const showNotification = ({
    type = 'info',
    message = '',
    duration = 3000,
    position = 'top-right',
    showClose = true,
    autoDismiss = true
  }) => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    // Update notification state
    notificationState.value = {
      visible: true,
      type,
      message,
      duration,
      position,
      showClose,
      autoDismiss
    }

    // Auto dismiss
    if (autoDismiss && duration > 0) {
      timeoutId = setTimeout(() => {
        hideNotification()
      }, duration)
    }
  }

  const hideNotification = () => {
    notificationState.value.visible = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // Convenience methods
  const success = (message, options = {}) => {
    showNotification({ type: 'success', message, ...options })
  }

  const error = (message, options = {}) => {
    showNotification({ type: 'error', message, ...options })
  }

  const warning = (message, options = {}) => {
    showNotification({ type: 'warning', message, ...options })
  }

  const info = (message, options = {}) => {
    showNotification({ type: 'info', message, ...options })
  }

  return {
    notificationState,
    showNotification,
    hideNotification,
    success,
    error,
    warning,
    info
  }
}