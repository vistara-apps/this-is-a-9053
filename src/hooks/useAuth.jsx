import { useState, useEffect, useContext, createContext } from 'react'
import { authService } from '../services/supabase'

// Create Auth Context
const AuthContext = createContext()

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for existing session on mount
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      setLoading(true)
      const { user, error } = await authService.getCurrentUser()
      
      if (error) {
        console.error('Error checking user:', error)
        setError(error)
      } else {
        setUser(user)
      }
    } catch (err) {
      console.error('Error in checkUser:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const { user, error } = await authService.signUp(email, password)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }
      
      setUser(user)
      return { success: true, user }
    } catch (err) {
      const errorMessage = err.message
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const { user, error } = await authService.signIn(email, password)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }
      
      setUser(user)
      return { success: true, user }
    } catch (err) {
      const errorMessage = err.message
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await authService.signOut()
      
      if (error) {
        setError(error)
        return { success: false, error }
      }
      
      setUser(null)
      return { success: true }
    } catch (err) {
      const errorMessage = err.message
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
    checkUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Hook for checking authentication status
export const useAuthStatus = () => {
  const { user, loading } = useAuth()
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user
  }
}

// Hook for protected routes
export const useRequireAuth = () => {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login or show login modal
      console.warn('User not authenticated')
    }
  }, [user, loading])
  
  return {
    user,
    loading,
    isAuthenticated: !!user
  }
}
