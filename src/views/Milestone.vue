<!-- MilestoneTab.vue - Complete Working Version -->
<template>
  <div class="performance-page milestone-tab">
    <!-- Modern Page Header with Stats -->
    <div class="modern-header">
      <div class="header-left">
        <h1>Milestones</h1>
        <p class="subtitle">Track and manage your project milestones</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip">
          <span class="stat-icon">🏆</span>
          <span class="stat-value">{{ totalElements }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-chip active">
          <span class="stat-icon">✅</span>
          <span class="stat-value">{{ getStatusCount('ACTIVE') }}</span>
          <span class="stat-label">Active</span>
        </div>
        <div class="stat-chip inactive">
          <span class="stat-icon">❌</span>
          <span class="stat-value">{{ getStatusCount('INACTIVE') }}</span>
          <span class="stat-label">Inactive</span>
        </div>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="search-section">
        <div class="search-container">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by title, code or description..."
            class="search-input"
            @input="handleSearch"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">✕</button>
        </div>
        
        <div class="filter-container">
          <select v-model="statusFilter" class="filter-select" @change="handleFilter">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>
      
      <div class="actions-section">
        <button class="btn-primary" @click="openCreateModal">
          <span class="btn-icon">+</span>
          Create Milestone
        </button>
        <button class="btn-secondary" @click="openAccessModal">
          <span class="btn-icon">👥</span>
          User Access
        </button>
      </div>
    </div>

    <!-- Milestones Table -->
    <div class="table-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading milestones...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="btn-retry" @click="fetchMilestones">Try Again</button>
      </div>

      <div v-else class="table-responsive">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Conditions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="milestone in paginatedMilestones" :key="milestone.id">
              <td><span class="code-badge">{{ milestone.code }}</span></td>
              <td>
                <div class="title-main">{{ milestone.title }}</div>
                <div v-if="milestone.title_kh" class="title-secondary">{{ milestone.title_kh }}</div>
                </td>
              <td>
                <div class="description-main">{{ milestone.description || '—' }}</div>
                <div v-if="milestone.description_kh" class="description-secondary">{{ milestone.description_kh }}</div>
                </td>
              <td>
                <span class="status-badge" :class="getStatusClass(milestone.status)">
                  {{ milestone.status }}
                </span>
                </td>
              <td class="date-text">{{ formatDate(milestone.created_at) }}</td>
              <td>
                <div v-if="milestone.conditions && milestone.conditions.length" class="condition-chips">
                  <span v-for="(condition, idx) in milestone.conditions.slice(0, 2)" :key="idx" class="condition-chip">
                    {{ getShortConditionText(condition) }}
                  </span>
                  <span v-if="milestone.conditions.length > 2" class="condition-more">
                    +{{ milestone.conditions.length - 2 }}
                  </span>
                </div>
                <span v-else>—</span>
                </td>
              <td>
                <div class="action-buttons">
                  <button class="icon-btn edit-btn" @click="openEditModal(milestone)" title="Edit">✏️</button>
                  <button class="icon-btn delete-btn" @click="openDeleteModal(milestone)" title="Delete">🗑️</button>
                </div>
                </td>
              </tr>
            <tr v-if="paginatedMilestones.length === 0">
              <td colspan="7" class="empty-row">
                <div class="empty-state">
                  <span class="empty-icon">🎯</span>
                  <p>No milestones found</p>
                  <button class="btn-link" @click="openCreateModal">Create your first milestone</button>
                </div>
                </td>
              </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <div class="pagination-info">
          Showing {{ paginatedMilestones.length }} of {{ filteredMilestones.length }} milestones
        </div>
        <div class="pagination-controls">
          <button class="page-btn" :disabled="currentPage === 0" @click="goToPage(currentPage - 1)">
            ← Previous
          </button>
          <div class="page-numbers">
            <button v-for="page in visiblePages" :key="page" class="page-number" :class="{ active: currentPage === page }" @click="goToPage(page)">
              {{ page + 1 }}
            </button>
          </div>
          <button class="page-btn" :disabled="!hasNext" @click="goToPage(currentPage + 1)">
            Next →
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Milestone Modal -->
    <div v-if="showMilestoneModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-icon">{{ modalMode === 'create' ? '✨' : '✏️' }}</span>
            <h2>{{ modalMode === 'create' ? 'Create New Milestone' : 'Edit Milestone' }}</h2>
          </div>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div v-if="fetchingDetails" class="fetching-details">
            <div class="loading-spinner-small"></div>
            <p>Loading milestone details...</p>
          </div>
          
          <form v-else @submit.prevent="submitMilestone" class="milestone-form">
            <div class="form-group full-width">
              <label>Code <span class="required">*</span></label>
              <input type="text" v-model="formData.code" required placeholder="e.g., WIN_20_STREAK" class="form-input" />
              <small>Unique identifier for the milestone</small>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Title (English) <span class="required">*</span></label>
                <input type="text" v-model="formData.title" required placeholder="Enter milestone title" class="form-input" />
              </div>
              <div class="form-group">
                <label>Title (Khmer)</label>
                <input type="text" v-model="formData.title_kh" placeholder="Enter Khmer title" class="form-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Description (English)</label>
                <textarea v-model="formData.description" rows="3" placeholder="Enter milestone description" class="form-textarea"></textarea>
              </div>
              <div class="form-group">
                <label>Description (Khmer)</label>
                <textarea v-model="formData.description_kh" rows="3" placeholder="Enter Khmer description" class="form-textarea"></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Icon URL</label>
                <input type="url" v-model="formData.icon_url" placeholder="https://example.com/icon.png" class="form-input" />
              </div>
              <div class="form-group">
                <label>Status</label>
                <input type="text" v-model="formData.status" placeholder="ACTIVE or INACTIVE" class="form-input" />
                <small>Enter: ACTIVE or INACTIVE</small>
              </div>
            </div>

            <!-- Conditions Section - Free Text Inputs -->
            <div class="conditions-section">
              <div class="conditions-header">
                <div class="conditions-title">
                  <span>⚙️</span>
                  <h3>Conditions</h3>
                  <span v-if="formData.conditions.length" class="conditions-badge">({{ formData.conditions.length }})</span>
                </div>
                <button type="button" class="btn-add-condition" @click="addCondition">+ Add Condition</button>
              </div>
              
              <div class="conditions-list">
                <div v-for="(condition, index) in formData.conditions" :key="index" class="condition-item">
                  <div class="condition-number">{{ index + 1 }}</div>
                  <div class="condition-fields">
                    <input 
                      type="text" 
                      v-model="condition.metric_type" 
                      class="condition-input"
                      placeholder="Metric type (e.g., WIN_STREAK, LOSS_STREAK)"
                    />
                    
                    <input 
                      type="text" 
                      v-model="condition.operator" 
                      class="condition-input operator"
                      placeholder="Operator (e.g., >, >=, <, <=, =)"
                    />
                    
                    <input 
                      type="number" 
                      v-model="condition.target_value" 
                      class="condition-input" 
                      placeholder="Target value" 
                      step="0.01"
                    />
                    
                    <button type="button" class="btn-remove-condition" @click="removeCondition(index)">✕</button>
                  </div>
                </div>
              </div>
              
              <div v-if="formData.conditions.length === 0" class="empty-conditions">
                <span>📋</span>
                <p>No conditions added yet</p>
                <small>Click "Add Condition" to set milestone requirements</small>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-save" :disabled="submitting">
                {{ submitting ? 'Saving...' : (modalMode === 'create' ? 'Create Milestone' : 'Save Changes') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container modal-small">
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-icon">⚠️</span>
            <h2>Delete Milestone</h2>
          </div>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete the milestone:</p>
          <p class="delete-target">"{{ selectedMilestone?.title }}"</p>
          <p class="delete-warning">This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="closeDeleteModal">Cancel</button>
            <button class="btn-danger" @click="confirmDelete" :disabled="deleting">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- User Access Modal -->
    <div v-if="showAccessModal" class="modal-overlay" @click.self="closeAccessModal">
      <div class="modal-container modal-medium">
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-icon">👥</span>
            <h2>User Access Management</h2>
          </div>
          <button class="modal-close" @click="closeAccessModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingUsers" class="loading-state">
            <div class="loading-spinner-small"></div>
            <p>Loading users...</p>
          </div>
          
          <div v-else-if="usersError" class="error-state">
            <span class="error-icon">⚠️</span>
            <p>{{ usersError }}</p>
            <button class="btn-retry" @click="fetchUsers">Retry</button>
          </div>
          
          <div v-else>
            <div class="access-badge-section">
              <div class="access-badge-label">User Access Management</div>
              <div class="access-badge info">
                ℹ️ Toggle switch to enable/disable user access
              </div>
            </div>

            <div class="users-section">
              <h3>Manage User Access</h3>
              <div class="users-list">
                <div v-for="user in usersList" :key="user.user_id" class="user-item">
                  <div class="user-avatar">{{ getUserInitial(user.user_id) }}</div>
                  <div class="user-info">
                    <div class="user-name">User ID: {{ user.user_id }} - {{ user.username }}</div>
                    <div class="user-email">
                      Status: 
                      <span :class="user.is_enabled ? 'status-enabled' : 'status-disabled'">
                        {{ user.is_enabled ? 'Enabled' : 'Disabled' }}
                      </span>
                    </div>
                    <div v-if="user.enabled_at" class="user-email-small">
                      Enabled at: {{ formatDate(user.enabled_at) }}
                    </div>
                    <div v-if="user.created_at" class="user-email-small">
                      Created at: {{ formatDate(user.created_at) }}
                    </div>
                  </div>
                  <div class="access-control">
                    <label class="switch-label">
                      <span class="switch-text">{{ user.is_enabled ? 'Enabled' : 'Disabled' }}</span>
                      <label class="switch">
                        <input 
                          type="checkbox" 
                          v-model="user.is_enabled"
                          @change="updateUserAccess(user)"
                          :disabled="updatingAccess"
                        />
                        <span class="slider round"></span>
                      </label>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="access-summary">
              <h3>Access Summary</h3>
              <div class="summary-stats">
                <div class="summary-card">
                  <div class="summary-value">{{ usersList.length }}</div>
                  <div class="summary-label">Total Users</div>
                </div>
                <div class="summary-card">
                  <div class="summary-value">{{ getEnabledCount() }}</div>
                  <div class="summary-label">Enabled</div>
                </div>
                <div class="summary-card">
                  <div class="summary-value">{{ getDisabledCount() }}</div>
                  <div class="summary-label">Disabled</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span class="toast-icon">{{ toastIcon }}</span>
      <div class="toast-content">
        <div class="toast-title">{{ toastType === 'success' ? 'Success!' : 'Error' }}</div>
        <div class="toast-message">{{ toastMessage }}</div>
      </div>
      <button class="toast-close" @click="showToast = false">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_MILESTONE_BASE_URL || 'http://localhost:8081'

// State
const milestones = ref([])
const loading = ref(false)
const error = ref(null)
const currentPage = ref(0)
const pageSize = 10

// Search and filter
const searchQuery = ref('')
const statusFilter = ref('')
let searchTimeout = null

// User access state
const usersList = ref([])
const loadingUsers = ref(false)
const usersError = ref(null)
const updatingAccess = ref(false)

// Computed: Filter milestones
const filteredMilestones = computed(() => {
  let result = milestones.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m => 
      m.title?.toLowerCase().includes(query) ||
      m.code?.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query)
    )
  }
  
  if (statusFilter.value) {
    result = result.filter(m => m.status === statusFilter.value)
  }
  
  return result
})

// Paginated milestones
const paginatedMilestones = computed(() => {
  const start = currentPage.value * pageSize
  const end = start + pageSize
  return filteredMilestones.value.slice(start, end)
})

// Pagination computed
const totalElements = computed(() => filteredMilestones.value.length)
const totalPages = computed(() => Math.ceil(filteredMilestones.value.length / pageSize))
const hasNext = computed(() => currentPage.value < totalPages.value - 1)

// Visible page numbers
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 5) {
    for (let i = 0; i < total; i++) pages.push(i)
  } else {
    if (current <= 2) {
      for (let i = 0; i < 4; i++) pages.push(i)
      pages.push(total - 1)
    } else if (current >= total - 3) {
      pages.push(0)
      for (let i = total - 4; i < total; i++) pages.push(i)
    } else {
      pages.push(0)
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push(total - 1)
    }
  }
  return [...new Set(pages)]
})

// Modal states
const showMilestoneModal = ref(false)
const showDeleteModal = ref(false)
const showAccessModal = ref(false)
const modalMode = ref('create')
const selectedMilestone = ref(null)
const submitting = ref(false)
const deleting = ref(false)
const fetchingDetails = ref(false)

// Toast notification
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
let toastTimeout = null

// Toast icon computed
const toastIcon = computed(() => {
  return toastType.value === 'success' ? '✅' : '❌'
})

// Form data
const formData = ref({
  code: '',
  title: '',
  title_kh: '',
  description: '',
  description_kh: '',
  icon_url: '',
  status: 'ACTIVE',
  conditions: []
})

// Helper functions
const getStatusCount = (status) => {
  return milestones.value.filter(m => m.status === status).length
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusClass = (status) => {
  const classMap = {
    'ACTIVE': 'active',
    'INACTIVE': 'inactive'
  }
  return classMap[status] || 'inactive'
}

const getShortConditionText = (condition) => {
  return `${condition.metric_type || '?'} ${condition.operator || '?'} ${condition.target_value || '?'}`
}

const showNotification = (message, type = 'success') => {
  if (toastTimeout) clearTimeout(toastTimeout)
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  toastTimeout = setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// User Access Helper Functions
const getUserInitial = (userId) => {
  return `U${userId}`
}

const getEnabledCount = () => {
  return usersList.value.filter(u => u.is_enabled).length
}

const getDisabledCount = () => {
  return usersList.value.filter(u => !u.is_enabled).length
}

// API Calls for Milestones
const fetchMilestones = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_BASE_URL}/milestone/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 0, size: 100 })
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const result = await response.json()
    
    if (result.code === '200') {
      milestones.value = result.data?.contents || []
    } else {
      error.value = result.message || 'Failed to fetch milestones'
    }
  } catch (err) {
    console.error('Fetch error:', err)
    error.value = 'Cannot connect to server. Please try again.'
  } finally {
    loading.value = false
  }
}

const fetchMilestoneDetails = async (id) => {
  fetchingDetails.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/milestone/query/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const result = await response.json()
    
    if (result.code === '200') {
      const data = result.data
      return {
        code: data.code,
        title: data.title,
        title_kh: data.title_kh || '',
        description: data.description || '',
        description_kh: data.description_kh || '',
        icon_url: data.icon_url || '',
        status: data.status,
        conditions: data.conditions || []
      }
    } else {
      throw new Error(result.message || 'Failed to fetch milestone details')
    }
  } catch (err) {
    console.error('Fetch details error:', err)
    showNotification('Failed to load milestone details', 'error')
    return null
  } finally {
    fetchingDetails.value = false
  }
}

const createMilestone = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/milestone/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value)
    })
    
    const result = await response.json()
    
    if (result.code === '200') {
      showNotification('Milestone created successfully!', 'success')
      await fetchMilestones()
      return true
    } else {
      showNotification(result.message || 'Failed to create milestone', 'error')
      return false
    }
  } catch (err) {
    showNotification('Network error. Please try again.', 'error')
    return false
  }
}

const updateMilestone = async () => {
  try {
    const updateData = {
      milestone_id: selectedMilestone.value.id,
      code: formData.value.code,
      title: formData.value.title,
      title_kh: formData.value.title_kh || "",
      description: formData.value.description || "",
      description_kh: formData.value.description_kh || "",
      icon_url: formData.value.icon_url || "",
      status: formData.value.status,
      conditions: formData.value.conditions.map(cond => ({
        sequence_no: cond.sequence_no,
        metric_type: cond.metric_type,
        operator: cond.operator,
        target_value: parseFloat(cond.target_value) || 0
      }))
    }
    
    const response = await fetch(`${API_BASE_URL}/milestone/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    
    const result = await response.json()
    
    if (result.code === '200') {
      showNotification('Milestone updated successfully!', 'success')
      await fetchMilestones()
      return true
    } else {
      showNotification(result.message || 'Failed to update milestone', 'error')
      return false
    }
  } catch (err) {
    console.error('Update error:', err)
    showNotification('Network error. Please try again.', 'error')
    return false
  }
}

const deleteMilestone = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/milestone/delete/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    
    if (result.code === '200') {
      showNotification('Milestone deleted successfully!', 'success')
      await fetchMilestones()
      return true
    } else {
      showNotification(result.message || 'Failed to delete milestone', 'error')
      return false
    }
  } catch (err) {
    console.error('Delete error:', err)
    showNotification('Network error. Please try again.', 'error')
    return false
  }
}

// API Calls for User Access
const fetchUsers = async () => {
  loadingUsers.value = true
  usersError.value = null
  
  try {
    const response = await fetch(`${API_BASE_URL}/uma/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 0, size: 100 })
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const result = await response.json()
    
    if (result.code === '200') {
      usersList.value = result.data?.contents || []
    } else {
      usersError.value = result.message || 'Failed to fetch users'
    }
  } catch (err) {
    console.error('Fetch users error:', err)
    usersError.value = 'Cannot connect to server. Please try again.'
  } finally {
    loadingUsers.value = false
  }
}

const updateUserAccess = async (user) => {
  updatingAccess.value = true
  
  try {
    const originalState = user.is_enabled
    
    const response = await fetch(`${API_BASE_URL}/uma/update/${user.user_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    
    if (result.code === '200') {
      showNotification(`User ${user.user_id} ${user.is_enabled ? 'enabled' : 'disabled'} successfully!`, 'success')
      await fetchUsers()
    } else {
      showNotification(result.message || 'Failed to update user access', 'error')
      user.is_enabled = originalState
    }
  } catch (err) {
    console.error('Update user error:', err)
    showNotification('Network error. Please try again.', 'error')
    user.is_enabled = !user.is_enabled
  } finally {
    updatingAccess.value = false
  }
}

// Form handlers
const resetForm = () => {
  formData.value = {
    code: '',
    title: '',
    title_kh: '',
    description: '',
    description_kh: '',
    icon_url: '',
    status: 'ACTIVE',
    conditions: []
  }
}

const addCondition = () => {
  formData.value.conditions.push({
    sequence_no: formData.value.conditions.length + 1,
    metric_type: '',
    operator: '',
    target_value: 0
  })
}

const removeCondition = (index) => {
  formData.value.conditions.splice(index, 1)
  formData.value.conditions.forEach((condition, idx) => {
    condition.sequence_no = idx + 1
  })
}

// Navigation
const goToPage = (page) => {
  if (page < 0 || page >= totalPages.value) return
  currentPage.value = page
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 0
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 0
  }, 300)
}

const handleFilter = () => {
  currentPage.value = 0
}

// Modal handlers
const openCreateModal = () => {
  modalMode.value = 'create'
  resetForm()
  showMilestoneModal.value = true
}

const openEditModal = async (milestone) => {
  modalMode.value = 'edit'
  selectedMilestone.value = milestone
  showMilestoneModal.value = true
  
  const details = await fetchMilestoneDetails(milestone.id)
  if (details) {
    formData.value = { ...details }
  } else {
    formData.value = {
      code: milestone.code,
      title: milestone.title,
      title_kh: milestone.title_kh || '',
      description: milestone.description || '',
      description_kh: milestone.description_kh || '',
      icon_url: milestone.icon_url || '',
      status: milestone.status,
      conditions: milestone.conditions || []
    }
  }
}

const openDeleteModal = (milestone) => {
  selectedMilestone.value = milestone
  showDeleteModal.value = true
}

const openAccessModal = () => {
  showAccessModal.value = true
  fetchUsers()
}

const closeModal = () => {
  showMilestoneModal.value = false
  selectedMilestone.value = null
  resetForm()
  fetchingDetails.value = false
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedMilestone.value = null
}

const closeAccessModal = () => {
  showAccessModal.value = false
}

const submitMilestone = async () => {
  submitting.value = true
  let success = false
  
  if (modalMode.value === 'create') {
    success = await createMilestone()
  } else {
    success = await updateMilestone()
  }
  
  submitting.value = false
  
  if (success) {
    closeModal()
  }
}

const confirmDelete = async () => {
  deleting.value = true
  const success = await deleteMilestone(selectedMilestone.value.id)
  deleting.value = false
  
  if (success) {
    closeDeleteModal()
  }
}

// Lifecycle
onMounted(() => {
  fetchMilestones()
})
</script>

<style scoped>
/* ============================================
   VARIABLES
   ============================================ */
.milestone-tab {
  --bg-panel: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --border-color: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --primary: #667eea;
  --primary-dark: #5a67d8;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.dark .milestone-tab {
  --bg-panel: #1f2937;
  --bg-secondary: #374151;
  --bg-tertiary: #4b5563;
  --border-color: #4b5563;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
}

/* ============================================
   HEADER
   ============================================ */
.modern-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: clamp(1.5rem, 4vw, 1.875rem);
  font-weight: 700;
  color: var(--text-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.header-stats {
  display: flex;
  gap: 12px;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-radius: 40px;
  border: 1px solid var(--border-color);
}

.stat-chip .stat-icon {
  font-size: 1rem;
}

.stat-chip .stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-chip .stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.stat-chip.active .stat-value {
  color: var(--success);
}

.stat-chip.inactive .stat-value {
  color: var(--danger);
}

/* ============================================
   CONTROLS BAR
   ============================================ */
.controls-bar {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.search-section {
  display: flex;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: var(--bg-panel);
  color: var(--text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1rem;
  padding: 4px;
  border-radius: 4px;
}

.clear-search:hover {
  background: var(--bg-secondary);
  color: var(--danger);
}

.filter-select {
  padding: 10px 32px 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: var(--bg-panel);
  color: var(--text-primary);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

.filter-select:hover {
  border-color: var(--primary);
}

.actions-section {
  display: flex;
  gap: 12px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--border-color);
}

/* ============================================
   TABLE
   ============================================ */
.table-wrapper {
  background: var(--bg-panel);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table thead {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.modern-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.modern-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.code-badge {
  font-family: monospace;
  font-size: 0.75rem;
  background: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--text-secondary);
}

.title-main {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.title-secondary {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.description-main {
  font-size: 0.813rem;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.description-secondary {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 40px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.date-text {
  font-size: 0.813rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.condition-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.condition-chip {
  font-size: 0.7rem;
  background: var(--bg-tertiary);
  padding: 4px 10px;
  border-radius: 20px;
  color: var(--text-secondary);
}

.condition-more {
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: 20px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  font-size: 1rem;
}

.icon-btn.edit-btn:hover {
  background: var(--primary);
  color: white;
}

.icon-btn.delete-btn:hover {
  background: var(--danger);
  color: white;
}

/* ============================================
   PAGINATION
   ============================================ */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 16px;
  background: var(--bg-panel);
}

.pagination-info {
  font-size: 0.813rem;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-number {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.page-number:hover {
  background: var(--bg-secondary);
}

.page-number.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border-color: var(--primary);
}

.page-btn {
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ============================================
   LOADING & ERROR STATES
   ============================================ */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.loading-spinner-small {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 60px 20px;
}

.error-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.btn-retry {
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--primary);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  cursor: pointer;
}

.empty-row td {
  text-align: center;
  padding: 60px 20px !important;
}

.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 16px 0;
  color: var(--text-secondary);
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: underline;
}

/* ============================================
   MODAL
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-container {
  background: var(--bg-panel);
  border-radius: var(--radius-lg);
  max-width: 850px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-container.modal-small {
  max-width: 450px;
}

.modal-container.modal-medium {
  max-width: 650px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--bg-panel);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--text-secondary);
}

.modal-close:hover {
  background: var(--danger);
  color: white;
}

.modal-body {
  padding: 24px;
}

.fetching-details {
  text-align: center;
  padding: 60px 20px;
}

/* ============================================
   FORM
   ============================================ */
.milestone-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.required {
  color: var(--danger);
}

.form-input,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: var(--bg-panel);
  color: var(--text-primary);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group small {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

/* Conditions Section - Free Text Inputs */
.conditions-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-top: 8px;
}

.conditions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.conditions-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.conditions-title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.conditions-badge {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 20px;
}

.btn-add-condition {
  padding: 6px 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
}

.conditions-list {
  max-height: 400px;
  overflow-y: auto;
}

.condition-item {
  background: var(--bg-panel);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-color);
}

.condition-number {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.condition-fields {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 100px 120px auto;
  gap: 12px;
  align-items: center;
}

.condition-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.813rem;
  background: var(--bg-panel);
  color: var(--text-primary);
  width: 100%;
}

.condition-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.condition-input.operator {
  text-align: center;
  font-weight: 600;
}

.btn-remove-condition {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--danger);
  cursor: pointer;
  font-size: 1rem;
}

.btn-remove-condition:hover {
  background: var(--danger);
  color: white;
}

.empty-conditions {
  text-align: center;
  padding: 32px;
}

.empty-conditions span {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-conditions p {
  margin: 0 0 4px 0;
  color: var(--text-secondary);
}

.empty-conditions small {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--border-color);
}

.btn-save {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--success), #059669);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--danger), #dc2626);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.delete-target {
  text-align: center;
  font-size: 1.125rem;
  margin: 16px 0;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.delete-warning {
  text-align: center;
  font-size: 0.813rem;
  color: var(--danger);
  margin-bottom: 20px;
}

/* ============================================
   USER ACCESS MODAL STYLES
   ============================================ */
.access-badge-section {
  text-align: center;
  margin-bottom: 32px;
}

.access-badge-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.access-badge.info {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  font-size: 0.875rem;
  padding: 12px 24px;
  border-radius: 40px;
  display: inline-block;
}

.users-section h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 24px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.user-email-small {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.status-enabled {
  color: var(--success);
  font-weight: 500;
}

.status-disabled {
  color: var(--danger);
  font-weight: 500;
}

.access-control {
  display: flex;
  align-items: center;
}

/* Toggle Switch */
.switch-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.switch-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  min-width: 60px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--danger);
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--success);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.access-summary {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 16px;
}

.access-summary h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.summary-card {
  text-align: center;
  padding: 12px;
  background: var(--bg-panel);
  border-radius: var(--radius-sm);
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* ============================================
   TOAST
   ============================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-panel);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 3000;
  animation: slideIn 0.3s ease;
  min-width: 300px;
  border: 1px solid var(--border-color);
}

.dark .toast {
  background: #1f2937;
}

.toast.success {
  border-left: 4px solid var(--success);
}

.toast.error {
  border-left: 4px solid var(--danger);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.toast-message {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1rem;
  padding: 4px;
  border-radius: var(--radius-sm);
}

.toast-close:hover {
  background: var(--bg-secondary);
  color: var(--danger);
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1024px) {
  .condition-fields {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .modern-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .controls-bar {
    flex-direction: column;
  }
  
  .search-section {
    width: 100%;
  }
  
  .actions-section {
    width: 100%;
  }
  
  .actions-section button {
    flex: 1;
  }
  
  .pagination {
    flex-direction: column;
  }
  
  .page-numbers {
    order: -1;
  }
  
  .modal-container {
    width: 95%;
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .user-item {
    flex-wrap: wrap;
  }
  
  .access-control {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .stat-chip {
    padding: 6px 12px;
  }
  
  .header-stats {
    width: 100%;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>