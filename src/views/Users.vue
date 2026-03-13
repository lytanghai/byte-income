<template>
  <div class="user-management">
    <!-- Header with title and add button -->
    <div class="header-actions">
      <h1>User Management</h1>
      <button class="btn btn-primary" @click="openCreateModal">
        <span class="btn-icon">+</span> 
        <span class="btn-text">Add New User</span>
      </button>
    </div>

    <!-- Search and filter bar -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by username..." 
          class="search-input"
          @input="filterUsers"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchUsers" class="btn btn-secondary">Retry</button>
    </div>

    <!-- Users table -->
    <div v-else class="table-container">
      <!-- Mobile cards view -->
      <div class="mobile-cards">
        <div v-if="filteredUsers.length === 0" class="no-data">No users found</div>
        <div v-for="user in paginatedUsers" :key="user.id" class="user-card">
          <div class="card-header">
            <div class="user-info">
              <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
              <div class="user-details">
                <span class="username">{{ user.username }}</span>
                <span class="user-id">ID: {{ user.id }}</span>
              </div>
            </div>
            <span class="status-badge" :class="user.status ? 'active' : 'inactive'">
              {{ user.status ? 'Active' : 'Inactive' }}
            </span>
          </div>
          
          <div class="card-dates">
            <div class="date-item">
              <span class="date-label">Created:</span>
              <span class="date-value">{{ formatDate(user.created_at) }}</span>
            </div>
            <div class="date-item">
              <span class="date-label">Updated:</span>
              <span class="date-value">{{ formatDate(user.last_updated_at) }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="action-btn password" @click="openChangePasswordModal(user)" title="Change Password">
              <span class="action-icon">🔑</span>
              <span class="action-text">Password</span>
            </button>
            <button class="action-btn delete" @click="confirmDelete(user)" title="Delete">
              <span class="action-icon">🗑️</span>
              <span class="action-text">Delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop table view -->
      <table class="users-table desktop-only">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" class="no-data">No users found</td>
          </tr>
          <tr v-for="user in paginatedUsers" :key="user.id" class="user-row">
            <td>{{ user.id }}</td>
            <td class="username-cell">
              <div class="username-info">
                <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
                <span class="username-text">{{ user.username }}</span>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="user.status ? 'active' : 'inactive'">
                {{ user.status ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="date-cell">{{ formatDate(user.created_at) }}</td>
            <td class="date-cell">{{ formatDate(user.last_updated_at) }}</td>
            <td class="actions-cell">
              <button class="action-btn password" @click="openChangePasswordModal(user)" title="Change Password">
                🔑
              </button>
              <button class="action-btn delete" @click="confirmDelete(user)" title="Delete">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 0"
          class="pagination-btn"
        >
          <span class="pagination-icon">←</span>
          <span class="pagination-text">Previous</span>
        </button>
        <span class="page-info">
          Page {{ currentPage + 1 }} of {{ totalPages }}
        </span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage >= totalPages - 1"
          class="pagination-btn"
        >
          <span class="pagination-text">Next</span>
          <span class="pagination-icon">→</span>
        </button>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Create New User</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="handleUserSubmit" class="modal-form">
          <div class="form-group">
            <label for="username">Username *</label>
            <input 
              type="text" 
              id="username"
              v-model="userForm.username" 
              required
              placeholder="Enter username"
            />
          </div>

          <div class="form-group">
            <label for="password">Password *</label>
            <input 
              type="password" 
              id="password"
              v-model="userForm.password" 
              required
              placeholder="Enter password"
              minlength="6"
            />
            <small class="hint">Password must be at least 6 characters</small>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="submitting">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-small"></span>
              {{ submitting ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Change Password</h2>
          <button class="close-btn" @click="closePasswordModal">✕</button>
        </div>
        
        <div class="modal-subheader" v-if="selectedUser">
          <span class="subheader-text">User: <strong>{{ selectedUser.username }}</strong></span>
        </div>

        <form @submit.prevent="handlePasswordChange" class="modal-form">
          <div class="form-group">
            <label for="old-password">Current Password *</label>
            <input 
              type="password" 
              id="old-password"
              v-model="passwordForm.oldPassword" 
              required
              placeholder="Enter current password"
            />
          </div>

          <div class="form-group">
            <label for="new-password">New Password *</label>
            <input 
              type="password" 
              id="new-password"
              v-model="passwordForm.newPassword" 
              required
              placeholder="Enter new password"
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label for="confirm-password">Confirm New Password *</label>
            <input 
              type="password" 
              id="confirm-password"
              v-model="passwordForm.confirmPassword" 
              required
              placeholder="Confirm new password"
              minlength="6"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closePasswordModal" :disabled="submitting">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-small"></span>
              {{ submitting ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content confirm-delete" @click.stop>
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="close-btn" @click="closeDeleteModal">✕</button>
        </div>
        
        <div class="delete-content">
          <div class="delete-icon">⚠️</div>
          <p class="delete-message">Are you sure you want to delete user <strong>{{ selectedUser?.username }}</strong>?</p>
          <p class="warning">This action cannot be undone.</p>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeDeleteModal" :disabled="submitting">
            Cancel
          </button>
          <button type="button" class="btn btn-danger" @click="handleDelete" :disabled="submitting">
            <span v-if="submitting" class="spinner-small"></span>
            {{ submitting ? 'Deleting...' : 'Delete User' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useNotification } from '../composables/useNotification'

// Initialize notification composable
const notification = useNotification()

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// State
const users = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const currentPage = ref(0)
const itemsPerPage = ref(10)
const totalPages = ref(1)
const totalElements = ref(0)
const submitting = ref(false)

// Modal states
const showUserModal = ref(false)
const showPasswordModal = ref(false)
const showDeleteModal = ref(false)
const selectedUser = ref(null)

// Forms
const userForm = reactive({
  username: '',
  password: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  
  return users.value.filter(user => 
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const paginatedUsers = computed(() => {
  return filteredUsers.value
})

// Helper Methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const filterUsers = () => {
  currentPage.value = 0
}

// Get auth token from localStorage
const getAuthToken = () => {
  const authToken = localStorage.getItem('authToken')
  if (authToken) {
    try {
      return authToken
    } catch (e) {
      console.error('Error parsing authToken:', e)
    }
  }
  return null
}

// API Calls
const fetchUsers = async (page = currentPage.value) => {
  loading.value = true
  error.value = null
  
  try {
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/user/listing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        page: page
      })
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      users.value = data.data.content
      totalPages.value = data.data.total_page
      totalElements.value = data.data.total_element
      currentPage.value = page
    } else {
      throw new Error(data.message || 'Failed to fetch users')
    }
  } catch (err) {
    error.value = err.message || 'Failed to load users. Please try again.'
    console.error('Error fetching users:', err)
    notification.error(error.value)
  } finally {
    loading.value = false
  }
}

const changePage = (newPage) => {
  if (newPage >= 0 && newPage < totalPages.value) {
    fetchUsers(newPage)
  }
}

const registerUser = async (userData) => {
  try {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(userData)
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      await fetchUsers(currentPage.value)
      notification.success(`User ${data.data.username} created successfully!`)
      return { success: true, data }
    } else {
      throw new Error(data.message || 'Registration failed')
    }
  } catch (err) {
    console.error('Error registering user:', err)
    notification.error(err.message || 'Registration failed. Please try again.')
    throw err
  }
}

const changePassword = async (username, passwordData) => {
  try {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        username: username,
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword
      })
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      notification.success(data.message || 'Password changed successfully!')
      return { success: true, message: data.message }
    } else {
      throw new Error(data.message || 'Password change failed')
    }
  } catch (err) {
    console.error('Error changing password:', err)
    notification.error(err.message || 'Failed to change password. Please try again.')
    throw err
  }
}

const deleteUser = async (id) => {
  try {
    const token = getAuthToken()

    const response = await fetch(`${API_BASE_URL}/user/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        id: id
      })
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      await fetchUsers(currentPage.value)
      notification.success('User deleted successfully!')
      return { success: true }
    } else {
      throw new Error(data.message || 'Delete failed')
    }
  } catch (err) {
    console.error('Error deleting user:', err)
    notification.error(err.message || 'Failed to delete user. Please try again.')
    throw err
  }
}

// Modal handlers
const openCreateModal = () => {
  userForm.username = ''
  userForm.password = ''
  showUserModal.value = true
}

const openChangePasswordModal = (user) => {
  selectedUser.value = user
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  showPasswordModal.value = true
}

const confirmDelete = (user) => {
  selectedUser.value = user
  showDeleteModal.value = true
}

const closeModal = () => {
  showUserModal.value = false
  userForm.username = ''
  userForm.password = ''
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  selectedUser.value = null
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedUser.value = null
}

// Form submissions
const handleUserSubmit = async () => {
  if (!userForm.username || !userForm.password) {
    notification.error('Username and password are required')
    return
  }

  if (userForm.password.length < 6) {
    notification.error('Password must be at least 6 characters long')
    return
  }

  submitting.value = true
  
  try {
    await registerUser({
      username: userForm.username,
      password: userForm.password
    })
    closeModal()
  } catch (err) {
    // Error already handled in registerUser
  } finally {
    submitting.value = false
  }
}

const handlePasswordChange = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    notification.error('New passwords do not match')
    return
  }
  
  if (passwordForm.newPassword.length < 6) {
    notification.error('Password must be at least 6 characters long')
    return
  }

  submitting.value = true
  
  try {
    await changePassword(selectedUser.value.username, {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    closePasswordModal()
  } catch (err) {
    // Error already handled in changePassword
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  submitting.value = true
  
  try {
    await deleteUser(selectedUser.value.id)
    closeDeleteModal()
  } catch (err) {
    // Error already handled in deleteUser
  } finally {
    submitting.value = false
  }
}

// Watch for itemsPerPage change
watch(itemsPerPage, () => {
  fetchUsers(0)
})

// Load users on mount
onMounted(() => {
  fetchUsers(0)
})
</script>

<style scoped>
/* Global reset */
.user-management {
  --max-width: 1400px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 20px;
  --spacing-xl: 24px;
  
  width: 100%;
  max-width: 100%;
  min-height: 100%;
  padding: clamp(12px, 3vw, 20px);
  margin: 0 auto;
  box-sizing: border-box;
  overflow-x: hidden;
  position: relative;
}

/* Ensure all elements use border-box */
.user-management *,
.user-management *::before,
.user-management *::after {
  box-sizing: border-box;
}

/* Remove default button styles */
button {
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  transform: scale(1);
  transition: transform 0.1s, background-color 0.2s, border-color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

button:active {
  transform: scale(0.98);
}

/* Form inputs */
input, select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: 8px;
}

/* Prevent zoom on iOS */
@media screen and (-webkit-min-device-pixel-ratio: 0) { 
  select,
  textarea,
  input {
    font-size: 16px !important;
  }
}

/* Responsive utilities */
.mobile-only {
  display: none !important;
}

.desktop-only {
  display: table !important;
}

/* Header actions */
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(16px, 4vw, 24px);
  flex-wrap: wrap;
  gap: 16px;
}

.header-actions h1 {
  margin: 0;
  color: var(--text-main);
  font-size: clamp(1.25rem, 5vw, 1.5rem);
  font-weight: 600;
  line-height: 1.2;
  word-break: break-word;
}

/* Buttons */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  transform: scale(1);
  line-height: 1;
}

.btn:active {
  transform: scale(0.98);
}

.btn-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.btn-text {
  white-space: nowrap;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d5db;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Search bar */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(16px, 4vw, 24px);
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: min(250px, 100%);
  height: 44px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
  font-size: 1rem;
  z-index: 1;
}

.search-input {
  width: 100%;
  height: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  color: #1f2937;
  box-sizing: border-box;
  transition: all 0.2s;
}

.search-input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-color: transparent;
}

.dark .search-input {
  background: #1f2937;
  border-color: #374151;
  color: white;
}

/* Table container */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  box-sizing: border-box;
}

.dark .table-container {
  background: #1f2937;
}

/* Desktop table */
.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.users-table th {
  background: #f9fafb;
  padding: 16px;
  text-align: left;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  white-space: nowrap;
}

.dark .users-table th {
  background: #111827;
  color: #9ca3af;
  border-bottom-color: #374151;
}

.users-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  font-size: 0.875rem;
}

.dark .users-table td {
  border-bottom-color: #374151;
  color: #e5e7eb;
}

.user-row:hover {
  background: #f9fafb;
}

.dark .user-row:hover {
  background: #111827;
}

/* Username cell */
.username-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username-text {
  word-break: break-word;
  max-width: 200px;
  font-weight: 500;
}

/* Avatar */
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
  text-transform: uppercase;
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  text-align: center;
  min-width: 60px;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.dark .status-badge.active {
  background: #064e3b;
  color: #a7f3d0;
}

.dark .status-badge.inactive {
  background: #7f1d1d;
  color: #fecaca;
}

/* Date cell */
.date-cell {
  white-space: nowrap;
  font-size: 0.875rem;
}

/* Actions cell */
.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Action buttons */
.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s;
  flex-shrink: 0;
  transform: scale(1);
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.password {
  background: #fef3c7;
  color: #92400e;
}

.action-btn.password:hover {
  background: #fde68a;
}

.action-btn.delete {
  background: #fee2e2;
  color: #b91c1c;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.dark .action-btn.password {
  background: #78350f;
  color: #fcd34d;
}

.dark .action-btn.delete {
  background: #7f1d1d;
  color: #fca5a5;
}

/* Mobile cards */
.mobile-cards {
  display: none;
  padding: 16px;
  gap: 16px;
  flex-direction: column;
}

.user-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .user-card {
  background: #374151;
  border-color: #4b5563;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.user-details .username {
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
  word-break: break-word;
}

.dark .user-details .username {
  color: white;
}

.user-details .user-id {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.dark .user-details .user-id {
  color: #9ca3af;
}

.card-dates {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.dark .card-dates {
  background: #1f2937;
}

.date-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.date-label {
  color: #6b7280;
  font-weight: 500;
}

.dark .date-label {
  color: #9ca3af;
}

.date-value {
  color: #1f2937;
  font-weight: 500;
}

.dark .date-value {
  color: #e5e7eb;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.card-actions .action-btn {
  flex: 1;
  width: auto;
  height: 44px;
  gap: 8px;
  font-size: 0.875rem;
}

.action-text {
  display: inline-block;
}

/* No data */
.no-data {
  text-align: center;
  padding: 48px;
  color: #6b7280;
  font-size: 0.875rem;
  width: 100%;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(8px, 3vw, 16px);
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.dark .pagination {
  border-top-color: #374151;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  min-width: 90px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transform: scale(1);
}

.pagination-btn:active {
  transform: scale(0.97);
}

.dark .pagination-btn {
  background: #1f2937;
  border-color: #374151;
  color: #e5e7eb;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.dark .pagination-btn:hover:not(:disabled) {
  background: #374151;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: scale(1);
}

.pagination-icon {
  font-size: 1rem;
  line-height: 1;
}

.pagination-text {
  white-space: nowrap;
}

.page-info {
  color: #6b7280;
  font-size: 0.875rem;
  white-space: nowrap;
}

.dark .page-info {
  color: #9ca3af;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  box-sizing: border-box;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  position: relative;
}

.dark .modal-content {
  background: #1f2937;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: inherit;
  border-radius: 12px 12px 0 0;
  z-index: 1;
}

.dark .modal-header {
  border-bottom-color: #374151;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.125rem;
  color: #1f2937;
  word-break: break-word;
  padding-right: 16px;
  font-weight: 600;
}

.dark .modal-header h2 {
  color: white;
}

.modal-subheader {
  padding: 12px 24px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.dark .modal-subheader {
  background: #374151;
  border-bottom-color: #4b5563;
}

.subheader-text {
  font-size: 0.875rem;
  color: #374151;
}

.dark .subheader-text {
  color: #e5e7eb;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  transform: scale(1);
}

.close-btn:active {
  transform: scale(0.95);
  background: #f3f4f6;
}

.close-btn:hover {
  color: #374151;
}

.dark .close-btn {
  color: #9ca3af;
}

.dark .close-btn:hover {
  color: #e5e7eb;
  background: #374151;
}

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.dark .form-group label {
  color: #e5e7eb;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  box-sizing: border-box;
  transition: all 0.2s;
  height: 44px;
}

.form-group input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-color: transparent;
}

.dark .form-group input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.hint {
  display: block;
  margin-top: 6px;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
  position: sticky;
  bottom: 0;
}

.dark .form-actions {
  border-top-color: #374151;
  background: #111827;
}

/* Delete modal specific */
.confirm-delete {
  max-width: 400px;
}

.delete-content {
  padding: 32px 24px;
  text-align: center;
}

.delete-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  line-height: 1;
}

.delete-message {
  margin: 0 0 8px;
  color: #374151;
  font-size: 1rem;
  word-break: break-word;
}

.dark .delete-message {
  color: #e5e7eb;
}

.warning {
  color: #ef4444 !important;
  font-size: 0.875rem !important;
  margin: 0 !important;
  font-weight: 500;
}

/* Loading state */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Small spinner for buttons */
.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}

.btn-secondary .spinner-small {
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #374151;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error state */
.error-state {
  text-align: center;
  padding: 60px 20px;
}

.error-message {
  color: #ef4444;
  margin-bottom: 16px;
  font-size: 0.875rem;
  word-break: break-word;
}

/* Firefox select arrow fix */
@-moz-document url-prefix() {
  select {
    text-indent: 0.01px;
    text-overflow: '';
    padding-right: 32px;
  }
}

/* IE select arrow fix */
select::-ms-expand {
  display: none;
}

/* Tablet styles */
@media (max-width: 992px) {
  .users-table {
    min-width: 700px;
  }
  
  .username-text {
    max-width: 150px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  
  .mobile-cards {
    display: flex;
  }

  .user-management {
    padding: 12px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions h1 {
    text-align: center;
  }

  .btn {
    width: 100%;
    height: 44px;
    min-height: 44px;
    max-height: 44px;
    font-size: 1rem;
    padding: 0 20px;
  }

  .btn-icon {
    font-size: 1.25rem;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-input-wrapper {
    width: 100%;
    height: 48px;
  }

  .search-input {
    font-size: 16px;
    padding: 14px 14px 14px 42px;
  }

  .search-icon {
    left: 14px;
    font-size: 1.1rem;
  }

  .table-container {
    border-radius: 8px;
  }

  .user-card {
    padding: 16px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .card-header {
    margin-bottom: 12px;
  }

  .card-dates {
    padding: 12px;
    margin-bottom: 12px;
  }

  .date-item {
    font-size: 0.875rem;
  }

  .card-actions {
    gap: 8px;
  }

  .card-actions .action-btn {
    height: 48px;
    font-size: 0.875rem;
  }

  .action-text {
    display: inline-block;
  }

  .pagination {
    padding: 16px;
    gap: 8px;
  }

  .pagination-btn {
    min-width: 80px;
    height: 44px;
    padding: 0 12px;
    font-size: 0.875rem;
  }

  .pagination-icon {
    font-size: 1rem;
  }

  .page-info {
    font-size: 0.875rem;
  }

  .modal-content {
    max-width: 100%;
    margin: 0;
    border-radius: 8px;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-header h2 {
    font-size: 1rem;
  }

  .modal-subheader {
    padding: 10px 20px;
  }

  .modal-form {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group input {
    height: 48px;
    font-size: 16px;
  }

  .form-actions {
    padding: 16px 20px;
    flex-direction: column;
    gap: 8px;
  }

  .form-actions .btn {
    width: 100%;
    margin: 0;
    height: 48px;
  }

  .delete-content {
    padding: 24px 20px;
  }

  .delete-icon {
    font-size: 2.5rem;
  }

  .delete-message {
    font-size: 1rem;
  }

  .warning {
    font-size: 0.875rem;
  }

  .close-btn {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .user-card {
    padding: 12px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    font-size: 0.875rem;
  }

  .user-details .username {
    font-size: 0.9375rem;
  }

  .user-details .user-id {
    font-size: 0.6875rem;
  }

  .status-badge {
    min-width: 55px;
    padding: 3px 6px;
    font-size: 0.6875rem;
  }

  .card-dates {
    padding: 10px;
  }

  .date-item {
    font-size: 0.8125rem;
  }

  .date-label {
    font-size: 0.75rem;
  }

  .date-value {
    font-size: 0.75rem;
  }

  .card-actions .action-btn {
    height: 44px;
    font-size: 0.8125rem;
  }

  .pagination-btn {
    min-width: 70px;
    height: 40px;
    font-size: 0.8125rem;
  }

  .pagination-icon {
    font-size: 0.875rem;
  }

  .page-info {
    font-size: 0.8125rem;
  }

  .loading-state {
    padding: 40px 16px;
  }

  .error-state {
    padding: 40px 16px;
  }

  .no-data {
    padding: 32px 16px;
  }
}

/* Extra small mobile styles */
@media (max-width: 360px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .status-badge {
    align-self: flex-start;
  }

  .card-actions {
    flex-direction: column;
  }

  .card-actions .action-btn {
    width: 100%;
  }

  .pagination {
    gap: 4px;
  }

  .pagination-btn {
    min-width: 60px;
    padding: 0 8px;
  }

  .pagination-text {
    display: none;
  }

  .pagination-icon {
    display: block;
    font-size: 1rem;
  }
}

/* Landscape mode */
@media (max-width: 768px) and (orientation: landscape) {
  .modal-content {
    max-height: 85vh;
  }

  .modal-form {
    padding: 16px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group input {
    height: 40px;
  }

  .form-actions {
    padding: 12px 16px;
  }

  .form-actions .btn {
    height: 40px;
  }

  .delete-content {
    padding: 20px 16px;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .action-btn,
  .pagination-btn,
  .btn,
  .close-btn {
    min-height: 44px;
  }

  .action-btn {
    min-width: 44px;
  }

  .card-actions .action-btn {
    min-height: 48px;
  }

  input, select {
    font-size: 16px !important;
  }
}

/* Focus styles for accessibility */
.btn:focus-visible,
.action-btn:focus-visible,
.pagination-btn:focus-visible,
.close-btn:focus-visible,
.search-input:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.btn:focus:not(:focus-visible),
.action-btn:focus:not(:focus-visible),
.pagination-btn:focus:not(:focus-visible),
.close-btn:focus:not(:focus-visible),
.search-input:focus:not(:focus-visible) {
  outline: none;
}

/* High refresh rate displays */
@media (min-width: 1920px) {
  .user-management {
    padding: 24px;
    max-width: 1600px;
  }

  .btn {
    height: 44px;
    min-height: 44px;
    max-height: 44px;
    font-size: 1rem;
  }

  .users-table th,
  .users-table td {
    padding: 20px;
    font-size: 1rem;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .status-badge {
    padding: 6px 12px;
    font-size: 0.875rem;
    min-width: 70px;
  }

  .date-cell {
    font-size: 0.9375rem;
  }

  .pagination-btn {
    height: 44px;
    font-size: 1rem;
    min-width: 100px;
  }
}

/* Dark mode adjustments */
.dark .user-card {
  background: #374151;
  border-color: #4b5563;
}

.dark .card-dates {
  background: #1f2937;
}

.dark .date-label {
  color: #9ca3af;
}

.dark .date-value {
  color: #e5e7eb;
}

.dark .modal-content {
  background: #1f2937;
}

.dark .modal-subheader {
  background: #374151;
  border-bottom-color: #4b5563;
}

.dark .subheader-text {
  color: #e5e7eb;
}

.dark .close-btn:hover {
  background: #374151;
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .btn,
  .action-btn,
  .pagination-btn,
  .close-btn,
  .user-card,
  .spinner,
  .spinner-small,
  .modal-overlay {
    transition: none;
    animation: none;
  }
  
  .btn:active,
  .action-btn:active,
  .pagination-btn:active,
  .close-btn:active {
    transform: none;
  }
  
  .spinner,
  .spinner-small {
    animation: none;
  }
}
</style>