<template>
  <NotificationPopup
    v-model="notificationState.visible"
    :type="notificationState.type"
    :message="notificationState.message"
    :duration="notificationState.duration"
    :position="notificationState.position"
    :show-close="notificationState.showClose"
    :auto-dismiss="notificationState.autoDismiss"
    @close="handleClose"
  />
</template>

<script setup>
import { useNotification } from '../composables/useNotification'
import NotificationPopup from './NotificationPopup.vue'

const { notificationState, hideNotification } = useNotification()

const handleClose = () => {
  hideNotification()
}
</script>