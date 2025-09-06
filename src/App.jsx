import React, { useState, useEffect } from 'react'
import AppShell from './components/AppShell'
import LandingPage from './components/LandingPage'
import UserProfileForm from './components/UserProfileForm'
import Dashboard from './components/Dashboard'
import SubscriptionPlans from './components/SubscriptionPlans'
import ProgressTracker from './components/ProgressTracker'
import RecipeInstructions from './components/RecipeInstructions'
import { AuthProvider } from './hooks/useAuth'
import { paymentService } from './services/stripe'

function App() {
  const [currentView, setCurrentView] = useState('landing')
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState(null)

  useEffect(() => {
    // Load user data from localStorage on app start
    const savedUser = localStorage.getItem('nourish-user')
    const savedProfile = localStorage.getItem('nourish-profile')
    
    if (savedUser && savedProfile) {
      setUser(JSON.parse(savedUser))
      setUserProfile(JSON.parse(savedProfile))
      setCurrentView('dashboard')
    }
  }, [])

  const handleSignUp = (email, password) => {
    const newUser = {
      id: Date.now().toString(),
      email,
      subscriptionTier: null,
      subscriptionExpiresAt: null,
      createdAt: new Date().toISOString()
    }
    setUser(newUser)
    localStorage.setItem('nourish-user', JSON.stringify(newUser))
    setCurrentView('profile-setup')
  }

  const handleProfileComplete = (profile) => {
    const completeProfile = {
      ...profile,
      userId: user.id,
      createdAt: new Date().toISOString()
    }
    setUserProfile(completeProfile)
    localStorage.setItem('nourish-profile', JSON.stringify(completeProfile))
    setCurrentView('subscription')
  }

  const handleSubscriptionComplete = async (tier) => {
    try {
      // In a real app, this would handle Stripe payment
      const { subscription, error } = await paymentService.handleSubscription(tier, user.id, user.email)
      
      if (error) {
        console.error('Subscription error:', error)
        return
      }

      const updatedUser = {
        ...user,
        subscriptionTier: tier,
        subscriptionExpiresAt: subscription.currentPeriodEnd
      }
      setUser(updatedUser)
      localStorage.setItem('nourish-user', JSON.stringify(updatedUser))
      setCurrentView('dashboard')
    } catch (err) {
      console.error('Error completing subscription:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('nourish-user')
    localStorage.removeItem('nourish-profile')
    setUser(null)
    setUserProfile(null)
    setCurrentView('landing')
  }

  const handleMealSelect = (meal) => {
    setSelectedMeal(meal)
    setCurrentView('recipe')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onSignUp={handleSignUp} />
      case 'profile-setup':
        return <UserProfileForm onComplete={handleProfileComplete} />
      case 'subscription':
        return <SubscriptionPlans onSubscribe={handleSubscriptionComplete} />
      case 'dashboard':
        return <Dashboard 
          user={user} 
          profile={userProfile} 
          onNavigate={setCurrentView}
          onMealSelect={handleMealSelect}
        />
      case 'progress':
        return <ProgressTracker 
          user={user} 
          profile={userProfile} 
          onBack={() => setCurrentView('dashboard')} 
        />
      case 'recipe':
        return <RecipeInstructions 
          meal={selectedMeal}
          userProfile={userProfile}
          onBack={() => setCurrentView('dashboard')}
        />
      default:
        return <LandingPage onSignUp={handleSignUp} />
    }
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg">
        {(currentView === 'dashboard' || currentView === 'progress') ? (
          <AppShell user={user} onLogout={handleLogout} onNavigate={setCurrentView}>
            {renderCurrentView()}
          </AppShell>
        ) : currentView === 'recipe' ? (
          renderCurrentView()
        ) : (
          renderCurrentView()
        )}
      </div>
    </AuthProvider>
  )
}

export default App
