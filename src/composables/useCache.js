// composables/useCache.js
import { ref } from 'vue'

const CACHE_PREFIX = 'app_cache_'
const EXPIRY_SUFFIX = '_expiry'

export function useCache() {
  // Set cache with expiration (in minutes)
  const setCache = (key, value, expiryMinutes = 5) => {
    try {
      // Store the actual data
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value))
      
      // Store expiration timestamp
      const expiryTime = Date.now() + (expiryMinutes * 60 * 1000)
      localStorage.setItem(`${CACHE_PREFIX}${key}${EXPIRY_SUFFIX}`, expiryTime.toString())
      
      console.log(`✅ Cache set for ${key} (expires in ${expiryMinutes} minutes)`)
      return true
    } catch (err) {
      console.error('Failed to set cache:', err)
      return false
    }
  }

  // Get cache with expiration check - automatically removes if expired
  const getCache = (key) => {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`
      const expiryKey = `${CACHE_PREFIX}${key}${EXPIRY_SUFFIX}`
      
      // Check if cache exists
      const cached = localStorage.getItem(cacheKey)
      const expiry = localStorage.getItem(expiryKey)
      
      if (!cached || !expiry) {
        return null
      }
      
      // Check if expired
      const now = Date.now()
      const expiryTime = parseInt(expiry)
      
      if (now > expiryTime) {
        console.log(`⏰ Cache expired for ${key} - removing...`)
        // Automatically remove expired cache
        localStorage.removeItem(cacheKey)
        localStorage.removeItem(expiryKey)
        return null
      }
      
      return JSON.parse(cached)
    } catch (err) {
      console.error('Failed to get cache:', err)
      return null
    }
  }

  // Remove cache
  const removeCache = (key) => {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      localStorage.removeItem(`${CACHE_PREFIX}${key}${EXPIRY_SUFFIX}`)
      console.log(`🗑️ Cache removed for ${key}`)
      return true
    } catch (err) {
      console.error('Failed to remove cache:', err)
      return false
    }
  }

  // Clear all app cache (except protected keys)
  const clearAllCache = () => {
    try {
      const protectedKeys = ['authToken', 'isAuthenticated', 'userData', 'theme']
      let count = 0
      
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        
        // Skip protected keys
        if (protectedKeys.includes(key)) {
          continue
        }
        
        // Remove if it's app cache or expiry
        if (key.startsWith(CACHE_PREFIX) || key.endsWith(EXPIRY_SUFFIX)) {
          localStorage.removeItem(key)
          count++
        }
      }
      
      console.log(`🧹 Cleared ${count} cache items`)
      return count
    } catch (err) {
      console.error('Failed to clear cache:', err)
      return 0
    }
  }

  // Get cache stats - automatically removes expired during scan
  const getCacheStats = () => {
    const stats = {
      total: 0,
      valid: 0,
      expired: 0,
      size: 0
    }
    
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        
        if (key.startsWith(CACHE_PREFIX) && !key.endsWith(EXPIRY_SUFFIX)) {
          stats.total++
          
          const expiryKey = `${key}${EXPIRY_SUFFIX}`
          const expiry = localStorage.getItem(expiryKey)
          
          if (expiry) {
            const now = Date.now()
            const expiryTime = parseInt(expiry)
            
            if (now > expiryTime) {
              stats.expired++
              // Auto-remove expired cache during stats calculation
              localStorage.removeItem(key)
              localStorage.removeItem(expiryKey)
            } else {
              stats.valid++
              // Calculate size only for valid items
              const value = localStorage.getItem(key)
              stats.size += new Blob([value]).size
            }
          } else {
            stats.valid++
            const value = localStorage.getItem(key)
            stats.size += new Blob([value]).size
          }
        }
      }
    } catch (err) {
      console.error('Failed to get cache stats:', err)
    }
    
    return stats
  }

  // Clean expired cache manually
  const cleanExpiredCache = () => {
    let cleaned = 0
    
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        
        if (key.startsWith(CACHE_PREFIX) && key.endsWith(EXPIRY_SUFFIX)) {
          const cacheKey = key.replace(EXPIRY_SUFFIX, '')
          const expiry = localStorage.getItem(key)
          
          if (expiry) {
            const now = Date.now()
            const expiryTime = parseInt(expiry)
            
            if (now > expiryTime) {
              localStorage.removeItem(cacheKey)
              localStorage.removeItem(key)
              cleaned++
            }
          }
        }
      }
      
      console.log(`🧹 Cleaned ${cleaned} expired cache items`)
      return cleaned
    } catch (err) {
      console.error('Failed to clean expired cache:', err)
      return 0
    }
  }

  return {
    setCache,
    getCache,
    removeCache,
    clearAllCache,
    getCacheStats,
    cleanExpiredCache
  }
}