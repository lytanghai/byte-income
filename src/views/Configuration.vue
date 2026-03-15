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

    const response = await fetch(`${API_BASE_URL}/config/list`, {
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
    
    const response = await fetch(`${API_BASE_URL}/config/update`, {
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
  @import '../assets/styles/configuration.css';
</style>