<template>
  <div class="configuration-management">
    <!-- Header with title and add button -->
    <div class="header-actions">
      <h1>Configuration Management</h1>
      <button class="btn btn-primary" @click="openCreateModal">
        <span class="btn-icon">+</span> Add New Configuration
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
      <!-- <select v-model="itemsPerPage" class="items-per-page" @change="fetchConfigs">
        <option value="5">5 per page</option>
        <option value="10">10 per page</option>
        <option value="20">20 per page</option>
        <option value="50">50 per page</option>
      </select> -->
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
      <table class="configs-table">
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
          ← Previous
        </button>
        <span class="page-info">
          Page {{ currentPage + 1 }} of {{ totalPages }}
        </span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage >= totalPages - 1"
          class="pagination-btn"
        >
          Next →
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
        
        <form @submit.prevent="handleConfigSubmit" class="modal-form">
          <div class="form-group">
            <label for="name">Name *</label>
            <input 
              type="text" 
              id="name"
              v-model="configForm.name" 
              required
              :disabled="modalMode === 'edit'"
              placeholder="Enter configuration name (e.g., MAX_LOGIN_ATTEMPTS)"
            />
            <small class="hint">Configuration name should be in uppercase with underscores</small>
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
              {{ submitting ? 'Saving...' : (modalMode === 'create' ? 'Create Configuration' : 'Update Configuration') }}
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
            {{ submitting ? 'Deleting...' : 'Delete Configuration' }}
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
const API_BASE_URL = 'http://localhost:8080/kark-profit/config'

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
  return new Date(dateString).toLocaleDateString('en-US', {
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
.configuration-management {
  padding: clamp(12px, 3vw, 20px);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

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
  font-size: clamp(20px, 5vw, 24px);
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
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

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(16px, 4vw, 24px);
  gap: 16px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: min(250px, 100%);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: #1f2937;
  box-sizing: border-box;
}

.dark .search-input {
  background: #1f2937;
  border-color: #374151;
  color: white;
}

.items-per-page {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  cursor: pointer;
  min-width: 120px;
}

.dark .items-per-page {
  background: #1f2937;
  border-color: #374151;
  color: white;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

.dark .table-container {
  background: #1f2937;
}

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
  font-size: 14px;
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
  font-size: 14px;
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
  font-size: 16px;
  flex-shrink: 0;
}

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
  font-size: 13px;
  word-break: break-word;
  color: #4b5563;
  flex: 1;
}

.dark .value-text {
  color: #9ca3af;
}

.eye-toggle {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.2s;
}

.eye-toggle:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.dark .eye-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
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

.date-cell {
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
  flex-shrink: 0;
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

.no-data {
  text-align: center;
  padding: 48px;
  color: #6b7280;
}

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
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  min-width: 80px;
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
}

.page-info {
  color: #6b7280;
  font-size: 14px;
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
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.dark .modal-content {
  background: #1f2937;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: inherit;
  border-radius: 8px 8px 0 0;
}

.dark .modal-header {
  border-bottom-color: #374151;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  word-break: break-word;
  padding-right: 16px;
}

.dark .modal-header h2 {
  color: white;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.close-btn:hover {
  color: #374151;
}

.dark .close-btn {
  color: #9ca3af;
}

.dark .close-btn:hover {
  color: #e5e7eb;
}

.modal-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.dark .form-group label {
  color: #e5e7eb;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
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
  padding-right: 40px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.6;
  transition: all 0.2s;
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
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 8px 8px;
}

.dark .form-actions {
  border-top-color: #374151;
  background: #111827;
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

/* Delete modal specific styles */
.confirm-delete {
  max-width: 400px;
}

.delete-content {
  padding: 32px 24px;
  text-align: center;
}

.delete-icon {
  font-size: 48px;
  margin-bottom: 16px;
  line-height: 1;
}

.delete-message {
  margin: 0 0 8px;
  color: #374151;
  font-size: 16px;
  word-break: break-word;
}

.dark .delete-message {
  color: #e5e7eb;
}

.warning {
  color: #ef4444 !important;
  font-size: 14px !important;
  margin: 0 !important;
}

/* Loading state */
.loading-state {
  text-align: center;
  padding: 48px;
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

/* Error state */
.error-state {
  text-align: center;
  padding: 48px;
}

.error-message {
  color: #ef4444;
  margin-bottom: 16px;
}

/* Responsive */
@media (max-width: 768px) {
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
    justify-content: center;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-input-wrapper {
    width: 100%;
  }

  .items-per-page {
    width: 100%;
  }

  .modal-content {
    margin: 0;
  }

  .configs-table {
    font-size: 14px;
  }

  .configs-table td {
    padding: 12px 8px;
  }

  .name-info {
    gap: 8px;
  }

  .config-icon {
    width: 24px;
    height: 24px;
    font-size: 14px;
  }

  .name-text {
    max-width: 150px;
  }

  .value-wrapper {
    gap: 4px;
  }

  .value-text {
    max-width: 120px;
    font-size: 12px;
  }

  .actions-cell {
    flex-wrap: nowrap;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .configs-table {
    min-width: 750px;
  }

  .configs-table td {
    padding: 8px 4px;
  }

  .name-text {
    max-width: 120px;
    font-size: 12px;
  }

  .value-text {
    max-width: 100px;
    font-size: 11px;
  }

  .date-cell {
    font-size: 11px;
  }

  .eye-toggle {
    font-size: 16px;
  }

  .form-actions {
    flex-direction: column;
    padding: 16px;
  }

  .form-actions .btn {
    width: 100%;
    margin: 0;
    justify-content: center;
  }

  .pagination {
    gap: 8px;
  }

  .pagination-btn {
    padding: 8px 12px;
    min-width: 70px;
    font-size: 12px;
  }

  .page-info {
    font-size: 12px;
  }

  .delete-content {
    padding: 24px 16px;
  }

  .delete-icon {
    font-size: 40px;
  }

  .delete-message {
    font-size: 15px;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .action-btn {
    width: 40px;
    height: 40px;
  }
  
  .pagination-btn {
    padding: 12px 20px;
  }
  
  .close-btn {
    padding: 8px 12px;
  }
  
  .btn {
    padding: 12px 20px;
  }
  
  .form-actions .btn {
    padding: 14px 20px;
  }
  
  .eye-toggle,
  .password-toggle {
    padding: 8px;
    font-size: 20px;
  }
  
  input, select {
    font-size: 16px !important;
  }
}

/* Print styles */
@media print {
  .btn,
  .search-bar,
  .actions-cell,
  .pagination,
  .modal-overlay,
  .eye-toggle {
    display: none;
  }
  
  .table-container {
    box-shadow: none;
  }
  
  .configs-table {
    min-width: auto;
  }
  
  .value-text {
    color: black !important;
  }
}
</style>