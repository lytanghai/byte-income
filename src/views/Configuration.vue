<template>
  <div class="configuration-management">
    <!-- Header with title and add button -->
    <div class="header-actions">
      <h1>Configuration Management</h1>
      <button class="btn btn-primary" @click="openCreateModal">
        <span class="btn-icon">+</span> 
        <span class="btn-text">Add New Configuration</span>
      </button>
    </div>

    <!-- Search and filter bar -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by name or value..." 
          class="search-input"
          @input="filterConfigs"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading configurations...</p>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchConfigs" class="btn btn-secondary">Retry</button>
    </div>

    <!-- Configurations table -->
    <div v-else class="table-container">
      <!-- Mobile cards view -->
      <div class="mobile-cards">
        <div v-if="filteredConfigs.length === 0" class="no-data">No configurations found</div>
        <div v-for="config in paginatedConfigs" :key="config.id" class="config-card">
          <div class="card-header">
            <div class="config-info">
              <div class="config-icon">⚙️</div>
              <div class="config-details">
                <span class="config-name">{{ config.name }}</span>
                <span class="config-id">ID: {{ config.id }}</span>
              </div>
            </div>
            <span class="status-badge" :class="config.status ? 'active' : 'inactive'">
              {{ config.status ? 'Active' : 'Inactive' }}
            </span>
          </div>
          
          <div class="card-value">
            <div class="value-wrapper">
              <span class="value-label">Value:</span>
              <div class="value-content">
                <span class="value-text">
                  {{ isValueVisible[config.id] ? config.value : maskValue(config.value) }}
                </span>
                <button 
                  class="eye-toggle" 
                  @click="toggleValueVisibility(config.id)"
                  :title="isValueVisible[config.id] ? 'Hide value' : 'Show value'"
                >
                  {{ isValueVisible[config.id] ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="card-dates">
            <div class="date-item">
              <span class="date-label">Created:</span>
              <span class="date-value">{{ formatDate(config.created_at) }}</span>
            </div>
            <div class="date-item">
              <span class="date-label">Updated:</span>
              <span class="date-value">{{ formatDate(config.last_updated_at) }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="action-btn edit" @click="openEditModal(config)" title="Edit">
              <span class="action-icon">✏️</span>
              <span class="action-text">Edit</span>
            </button>
            <button class="action-btn delete" @click="confirmDelete(config)" title="Delete">
              <span class="action-icon">🗑️</span>
              <span class="action-text">Delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop table view -->
      <table class="configs-table desktop-only">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Value</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredConfigs.length === 0">
            <td colspan="7" class="no-data">No configurations found</td>
          </tr>
          <tr v-for="config in paginatedConfigs" :key="config.id" class="config-row">
            <td>{{ config.id }}</td>
            <td class="name-cell">
              <div class="name-info">
                <div class="config-icon">⚙️</div>
                <span class="name-text">{{ config.name }}</span>
              </div>
            </td>
            <td class="value-cell">
              <div class="value-wrapper">
                <span class="value-text">
                  {{ isValueVisible[config.id] ? config.value : maskValue(config.value) }}
                </span>
                <button 
                  class="eye-toggle" 
                  @click="toggleValueVisibility(config.id)"
                  :title="isValueVisible[config.id] ? 'Hide value' : 'Show value'"
                >
                  {{ isValueVisible[config.id] ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="config.status ? 'active' : 'inactive'">
                {{ config.status ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="date-cell">{{ formatDate(config.created_at) }}</td>
            <td class="date-cell">{{ formatDate(config.last_updated_at) }}</td>
            <td class="actions-cell">
              <button class="action-btn edit" @click="openEditModal(config)" title="Edit">
                ✏️
              </button>
              <button class="action-btn delete" @click="confirmDelete(config)" title="Delete">
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

    <!-- Create/Edit Configuration Modal -->
    <div v-if="showConfigModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ modalMode === 'create' ? 'Create New Configuration' : 'Edit Configuration' }}</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <div class="modal-subheader" v-if="modalMode === 'edit' && selectedConfig">
          <span class="subheader-text">Editing: <strong>{{ selectedConfig.name }}</strong></span>
        </div>

        <form @submit.prevent="handleConfigSubmit" class="modal-form">
          <div class="form-group">
            <label for="name">Name *</label>
            <input 
              type="text" 
              id="name"
              v-model="configForm.name" 
              required
              :disabled="modalMode === 'edit'"
              placeholder="e.g., MAX_LOGIN_ATTEMPTS"
            />
            <small class="hint">Use uppercase with underscores</small>
          </div>

          <div class="form-group">
            <label for="value">Value *</label>
            <div class="password-input-wrapper">
              <input 
                :type="showPassword ? 'text' : 'password'"
                id="value"
                v-model="configForm.value" 
                required
                placeholder="Enter configuration value"
              />
              <button 
                type="button"
                class="password-toggle" 
                @click="togglePasswordVisibility"
                :title="showPassword ? 'Hide value' : 'Show value'"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>

          <div v-if="modalMode === 'edit'" class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="configForm.status" class="status-select">
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="submitting">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-small"></span>
              {{ submitting ? 'Saving...' : (modalMode === 'create' ? 'Create' : 'Update') }}
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
          <p class="delete-message">Are you sure you want to delete configuration <strong>{{ selectedConfig?.name }}</strong>?</p>
          <p class="warning">This action cannot be undone.</p>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeDeleteModal" :disabled="submitting">
            Cancel
          </button>
          <button type="button" class="btn btn-danger" @click="handleDelete" :disabled="submitting">
            <span v-if="submitting" class="spinner-small"></span>
            {{ submitting ? 'Deleting...' : 'Delete' }}
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// State
const configs = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const currentPage = ref(0)
const itemsPerPage = ref(10)
const totalPages = ref(1)
const totalElements = ref(0)
const submitting = ref(false)

// Visibility states
const isValueVisible = ref({})
const showPassword = ref(false)

// Modal states
const showConfigModal = ref(false)
const showDeleteModal = ref(false)
const modalMode = ref('create')
const selectedConfig = ref(null)

// Form
const configForm = reactive({
  id: null,
  name: '',
  value: '',
  status: true
})

// Computed
const filteredConfigs = computed(() => {
  if (!searchQuery.value) return configs.value
  
  const query = searchQuery.value.toLowerCase()
  return configs.value.filter(config => 
    config.name.toLowerCase().includes(query) ||
    config.value.toLowerCase().includes(query)
  )
})

const paginatedConfigs = computed(() => {
  return filteredConfigs.value
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

const maskValue = (value) => {
  if (!value) return ''
  return '•'.repeat(Math.min(value.length, 20))
}

const toggleValueVisibility = (configId) => {
  isValueVisible.value = {
    ...isValueVisible.value,
    [configId]: !isValueVisible.value[configId]
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const filterConfigs = () => {
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
const fetchConfigs = async (page = currentPage.value) => {
  loading.value = true
  error.value = null
  
  try {
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        page: page,
        size: itemsPerPage.value
      })
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      configs.value = data.data.content
      totalPages.value = data.data.total_page
      totalElements.value = data.data.total_element
      currentPage.value = page
      
      // Reset visibility for new data
      isValueVisible.value = {}
    } else {
      throw new Error(data.message || 'Failed to fetch configurations')
    }
  } catch (err) {
    error.value = err.message || 'Failed to load configurations. Please try again.'
    console.error('Error fetching configurations:', err)
    notification.error(error.value)
  } finally {
    loading.value = false
  }
}

const changePage = (newPage) => {
  if (newPage >= 0 && newPage < totalPages.value) {
    fetchConfigs(newPage)
  }
}

const createConfig = async (configData) => {
  try {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: configData.name,
        value: configData.value
      })
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      await fetchConfigs(currentPage.value)
      notification.success(`Configuration created successfully!`)
      return { success: true, data }
    } else {
      throw new Error(data.message || 'Creation failed')
    }
  } catch (err) {
    console.error('Error creating configuration:', err)
    notification.error(err.message || 'Failed to create configuration. Please try again.')
    throw err
  }
}

const updateConfig = async (configData) => {
  try {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: configData.id,
        name: configData.name,
        value: configData.value
      })
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      await fetchConfigs(currentPage.value)
      notification.success(`Configuration updated successfully!`)
      return { success: true, data }
    } else {
      throw new Error(data.message || 'Update failed')
    }
  } catch (err) {
    console.error('Error updating configuration:', err)
    notification.error(err.message || 'Failed to update configuration. Please try again.')
    throw err
  }
}

const deleteConfig = async (id) => {
  try {
    const token = getAuthToken()

    const response = await fetch(`${API_BASE_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: id
      })
    })
    
    const data = await response.json()
    
    if (data.code === '200') {
      await fetchConfigs(currentPage.value)
      notification.success('Configuration deleted successfully!')
      return { success: true }
    } else {
      throw new Error(data.message || 'Delete failed')
    }
  } catch (err) {
    console.error('Error deleting configuration:', err)
    notification.error(err.message || 'Failed to delete configuration. Please try again.')
    throw err
  }
}

// Modal handlers
const openCreateModal = () => {
  modalMode.value = 'create'
  configForm.id = null
  configForm.name = ''
  configForm.value = ''
  configForm.status = true
  showPassword.value = false
  showConfigModal.value = true
}

const openEditModal = (config) => {
  modalMode.value = 'edit'
  selectedConfig.value = config
  configForm.id = config.id
  configForm.name = config.name
  configForm.value = config.value
  configForm.status = config.status
  showPassword.value = false
  showConfigModal.value = true
}

const confirmDelete = (config) => {
  selectedConfig.value = config
  showDeleteModal.value = true
}

const closeModal = () => {
  showConfigModal.value = false
  configForm.id = null
  configForm.name = ''
  configForm.value = ''
  configForm.status = true
  selectedConfig.value = null
  showPassword.value = false
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedConfig.value = null
}

// Form submissions
const handleConfigSubmit = async () => {
  if (!configForm.name || !configForm.value) {
    notification.error('Name and value are required')
    return
  }

  submitting.value = true
  
  try {
    if (modalMode.value === 'create') {
      await createConfig({
        name: configForm.name,
        value: configForm.value
      })
    } else {
      await updateConfig({
        id: configForm.id,
        name: configForm.name,
        value: configForm.value
      })
    }
    closeModal()
  } catch (err) {
    // Error already handled in API calls
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  submitting.value = true
  
  try {
    await deleteConfig(selectedConfig.value.id)
    closeDeleteModal()
  } catch (err) {
    // Error already handled in deleteConfig
  } finally {
    submitting.value = false
  }
}

// Watch for itemsPerPage change
watch(itemsPerPage, () => {
  fetchConfigs(0)
})

// Load configs on mount
onMounted(() => {
  fetchConfigs(0)
})
</script>

<style scoped>
/* Global reset */
.configuration-management {
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
.configuration-management *,
.configuration-management *::before,
.configuration-management *::after {
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
.configs-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 950px;
}

.configs-table th {
  background: #f9fafb;
  padding: 16px;
  text-align: left;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  white-space: nowrap;
}

.dark .configs-table th {
  background: #111827;
  color: #9ca3af;
  border-bottom-color: #374151;
}

.configs-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  font-size: 0.875rem;
}

.dark .configs-table td {
  border-bottom-color: #374151;
  color: #e5e7eb;
}

.config-row:hover {
  background: #f9fafb;
}

.dark .config-row:hover {
  background: #111827;
}

/* Name cell */
.name-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-text {
  word-break: break-word;
  max-width: 200px;
  font-weight: 500;
}

.config-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #6b7280;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

/* Value cell */
.value-cell {
  max-width: 300px;
}

.value-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-text {
  font-family: monospace;
  font-size: 0.8125rem;
  word-break: break-word;
  color: #4b5563;
  flex: 1;
}

.dark .value-text {
  color: #9ca3af;
}

/* Eye toggle */
.eye-toggle {
  background: none;
  border: none;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.2s;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  transform: scale(1);
}

.eye-toggle:active {
  transform: scale(0.95);
}

.eye-toggle:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.dark .eye-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
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

.action-btn.edit {
  background: #e0f2fe;
  color: #0369a1;
}

.action-btn.edit:hover {
  background: #bae6fd;
}

.action-btn.delete {
  background: #fee2e2;
  color: #b91c1c;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.dark .action-btn.edit {
  background: #0c4a6e;
  color: #7dd3fc;
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

.config-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.config-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .config-card {
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

.config-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.config-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.config-details .config-name {
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
  word-break: break-word;
}

.dark .config-details .config-name {
  color: white;
}

.config-details .config-id {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.dark .config-details .config-id {
  color: #9ca3af;
}

.card-value {
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.dark .card-value {
  background: #1f2937;
}

.value-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-right: 8px;
  font-weight: 500;
}

.dark .value-label {
  color: #9ca3af;
}

.value-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  box-sizing: border-box;
  transition: all 0.2s;
  height: 44px;
}

.form-group input:focus,
.form-group select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-color: transparent;
}

.dark .form-group input,
.dark .form-group select {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.form-group input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.dark .form-group input:disabled {
  background: #4b5563;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  opacity: 0.6;
  transition: all 0.2s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(1);
}

.password-toggle:active {
  transform: scale(0.95);
}

.password-toggle:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.dark .password-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.status-select {
  cursor: pointer;
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
  .configs-table {
    min-width: 850px;
  }
  
  .name-text {
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

  .configuration-management {
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

  .config-card {
    padding: 16px;
  }

  .config-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .card-header {
    margin-bottom: 12px;
  }

  .config-details .config-name {
    font-size: 1rem;
  }

  .config-details .config-id {
    font-size: 0.75rem;
  }

  .card-value {
    padding: 12px;
    margin-bottom: 12px;
  }

  .value-label {
    font-size: 0.75rem;
  }

  .value-content {
    font-size: 0.9375rem;
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

  .eye-toggle {
    width: 32px;
    height: 32px;
    font-size: 1.25rem;
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

  /* Modal styles mobile */
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

  .form-group input,
  .form-group select {
    height: 48px;
    font-size: 16px;
  }

  .password-toggle {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
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
  .config-card {
    padding: 12px;
  }

  .config-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .config-details .config-name {
    font-size: 0.9375rem;
  }

  .config-details .config-id {
    font-size: 0.6875rem;
  }

  .status-badge {
    min-width: 55px;
    padding: 3px 6px;
    font-size: 0.6875rem;
  }

  .card-value {
    padding: 10px;
  }

  .value-label {
    font-size: 0.6875rem;
  }

  .value-content {
    font-size: 0.875rem;
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

  .eye-toggle {
    width: 28px;
    height: 28px;
    font-size: 1rem;
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

  .value-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .eye-toggle {
    align-self: flex-end;
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

  .form-group input,
  .form-group select {
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

  .card-actions {
    flex-direction: row;
  }

  .card-actions .action-btn {
    width: auto;
    flex: 1;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .action-btn,
  .pagination-btn,
  .btn,
  .close-btn,
  .eye-toggle,
  .password-toggle {
    min-height: 44px;
    min-width: 44px;
  }

  .action-btn {
    min-width: 44px;
  }

  .card-actions .action-btn {
    min-height: 48px;
  }

  .eye-toggle,
  .password-toggle {
    padding: 8px;
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
.search-input:focus-visible,
.eye-toggle:focus-visible,
.password-toggle:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.btn:focus:not(:focus-visible),
.action-btn:focus:not(:focus-visible),
.pagination-btn:focus:not(:focus-visible),
.close-btn:focus:not(:focus-visible),
.search-input:focus:not(:focus-visible),
.eye-toggle:focus:not(:focus-visible),
.password-toggle:focus:not(:focus-visible) {
  outline: none;
}

/* High refresh rate displays */
@media (min-width: 1920px) {
  .configuration-management {
    padding: 24px;
    max-width: 1600px;
  }

  .btn {
    height: 44px;
    min-height: 44px;
    max-height: 44px;
    font-size: 1rem;
  }

  .configs-table th,
  .configs-table td {
    padding: 20px;
    font-size: 1rem;
  }

  .config-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .name-text {
    font-size: 1rem;
    max-width: 250px;
  }

  .value-text {
    font-size: 0.9375rem;
  }

  .status-badge {
    padding: 6px 12px;
    font-size: 0.875rem;
    min-width: 70px;
  }

  .date-cell {
    font-size: 0.9375rem;
  }

  .action-btn {
    width: 40px;
    height: 40px;
    font-size: 1.125rem;
  }

  .pagination-btn {
    height: 44px;
    font-size: 1rem;
    min-width: 100px;
  }
}

/* Dark mode adjustments */
.dark .config-card {
  background: #374151;
  border-color: #4b5563;
}

.dark .card-value,
.dark .card-dates {
  background: #1f2937;
}

.dark .date-label,
.dark .value-label {
  color: #9ca3af;
}

.dark .date-value,
.dark .value-text {
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
  .eye-toggle,
  .password-toggle,
  .config-card,
  .spinner,
  .spinner-small,
  .modal-overlay {
    transition: none;
    animation: none;
  }
  
  .btn:active,
  .action-btn:active,
  .pagination-btn:active,
  .close-btn:active,
  .eye-toggle:active,
  .password-toggle:active {
    transform: none;
  }
  
  .spinner,
  .spinner-small {
    animation: none;
  }
}
</style>