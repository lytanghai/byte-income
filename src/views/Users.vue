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
          placeholder="Search by username or email..." 
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
                <span class="user-email">{{ user.email || 'No email' }}</span>
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
            <th>Email</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="no-data">No users found</td>
          </tr>
          <tr v-for="user in paginatedUsers" :key="user.id" class="user-row">
            <td>{{ user.id }}</td>
            <td class="username-cell">
              <div class="username-info">
                <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
                <span class="username-text">{{ user.username }}</span>
              </div>
            </td>
            <td class="email-cell">
              <div class="email-info">
                <span class="email-icon">📧</span>
                <span class="email-text">{{ user.email || '—' }}</span>
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
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email"
              v-model="userForm.email" 
              placeholder="Enter email address"
            />
            <small class="hint">Optional: User's email address for notifications</small>
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
          <span v-if="selectedUser.email" class="subheader-email">{{ selectedUser.email }}</span>
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
          <p v-if="selectedUser?.email" class="delete-email">{{ selectedUser.email }}</p>
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
  email: '',
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
  
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) ||
    (user.email && user.email.toLowerCase().includes(query))
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

    const response = await fetch(`${API_BASE_URL}/auth/user/listing`, {
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
    
    const payload = {
      username: userData.username,
      password: userData.password
    }
    
    // Add email if provided
    if (userData.email) {
      payload.email = userData.email
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(payload)
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
    
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
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

    const response = await fetch(`${API_BASE_URL}/auth/user/delete`, {
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
  userForm.email = ''
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
  userForm.email = ''
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
      email: userForm.email,
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
  @import '../assets/styles/user.css'
</style>