class AuthService {
  constructor() {
    this.baseURL = process.env.VUE_APP_API_URL || 'https://your-api-domain.com/api'
  }

  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          rememberMe: credentials.rememberMe
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Login failed',
          data: data
        }
      }

      return data
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.')
      }
      throw error
    }
  }

  logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userData')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('rememberMe')
  }

  getToken() {
    return localStorage.getItem('authToken')
  }

  isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true'
  }

  getUser() {
    const userData = localStorage.getItem('userData')
    return userData ? JSON.parse(userData) : null
  }
}

export default new AuthService()