import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key')

export const paymentService = {
  // Subscription tier configurations
  subscriptionTiers: {
    basic: {
      name: 'Basic',
      price: 15,
      priceId: 'price_basic_monthly', // This would be your actual Stripe price ID
      features: [
        'Personalized meal plans',
        'Basic recipe library',
        'Allergy & preference filtering',
        'Email support'
      ]
    },
    premium: {
      name: 'Premium',
      price: 25,
      priceId: 'price_premium_monthly',
      features: [
        'Everything in Basic',
        'Weekly progress tracking',
        'Meal plan adjustments',
        'Advanced analytics',
        'Priority support'
      ]
    },
    pro: {
      name: 'Pro',
      price: 40,
      priceId: 'price_pro_monthly',
      features: [
        'Everything in Premium',
        'Direct nutritionist consultation',
        'Custom meal requests',
        'Family meal planning',
        'Phone support'
      ]
    }
  },

  // Create checkout session for subscription
  async createCheckoutSession(tier, userId, userEmail) {
    try {
      // In a real app, this would call your backend API
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: this.subscriptionTiers[tier].priceId,
          userId: userId,
          userEmail: userEmail,
          tier: tier
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const session = await response.json()
      return { session, error: null }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { session: null, error: error.message }
    }
  },

  // Redirect to Stripe Checkout
  async redirectToCheckout(sessionId) {
    try {
      const stripe = await stripePromise
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error)
      throw error
    }
  },

  // Handle subscription flow (simplified for demo)
  async handleSubscription(tier, userId, userEmail) {
    try {
      // For demo purposes, we'll simulate a successful payment
      // In production, this would integrate with your backend and Stripe
      
      const subscriptionData = {
        tier: tier,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        customerId: `cus_demo_${userId}`,
        subscriptionId: `sub_demo_${Date.now()}`
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      return { subscription: subscriptionData, error: null }
    } catch (error) {
      return { subscription: null, error: error.message }
    }
  },

  // Get subscription status
  async getSubscriptionStatus(userId) {
    try {
      // In a real app, this would call your backend API
      const response = await fetch(`/api/subscription-status/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to get subscription status')
      }

      const subscription = await response.json()
      return { subscription, error: null }
    } catch (error) {
      console.error('Error getting subscription status:', error)
      return { subscription: null, error: error.message }
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      const result = await response.json()
      return { result, error: null }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return { result: null, error: error.message }
    }
  },

  // Update subscription
  async updateSubscription(subscriptionId, newTier) {
    try {
      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
          newPriceId: this.subscriptionTiers[newTier].priceId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      const result = await response.json()
      return { result, error: null }
    } catch (error) {
      console.error('Error updating subscription:', error)
      return { result: null, error: error.message }
    }
  },

  // Validate subscription access
  hasFeatureAccess(userTier, feature) {
    const tierHierarchy = ['basic', 'premium', 'pro']
    const userTierIndex = tierHierarchy.indexOf(userTier)
    
    const featureRequirements = {
      'basic_features': 0, // basic tier required
      'progress_tracking': 1, // premium tier required
      'meal_adjustments': 1, // premium tier required
      'nutritionist_consultation': 2, // pro tier required
      'family_planning': 2, // pro tier required
      'priority_support': 1, // premium tier required
      'phone_support': 2 // pro tier required
    }

    const requiredTierIndex = featureRequirements[feature]
    return requiredTierIndex !== undefined && userTierIndex >= requiredTierIndex
  },

  // Get tier limits
  getTierLimits(tier) {
    const limits = {
      basic: {
        mealPlansPerWeek: 7,
        recipesPerDay: 5,
        progressLogsPerMonth: 30,
        supportTicketsPerMonth: 2
      },
      premium: {
        mealPlansPerWeek: 14,
        recipesPerDay: 10,
        progressLogsPerMonth: 100,
        supportTicketsPerMonth: 10
      },
      pro: {
        mealPlansPerWeek: -1, // unlimited
        recipesPerDay: -1, // unlimited
        progressLogsPerMonth: -1, // unlimited
        supportTicketsPerMonth: -1 // unlimited
      }
    }

    return limits[tier] || limits.basic
  },

  // Format price for display
  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  },

  // Calculate prorated amount for tier changes
  calculateProration(currentTier, newTier, daysRemaining) {
    const currentPrice = this.subscriptionTiers[currentTier].price
    const newPrice = this.subscriptionTiers[newTier].price
    const dailyDifference = (newPrice - currentPrice) / 30
    
    return Math.max(0, dailyDifference * daysRemaining)
  }
}

// Demo backend endpoints (these would be implemented on your server)
export const demoBackendEndpoints = {
  // Create checkout session endpoint
  '/api/create-checkout-session': async (data) => {
    // This would be implemented on your backend
    return {
      sessionId: `cs_demo_${Date.now()}`,
      url: 'https://checkout.stripe.com/demo'
    }
  },

  // Subscription status endpoint
  '/api/subscription-status/:userId': async (userId) => {
    // This would query your database and Stripe
    return {
      status: 'active',
      tier: 'basic',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  },

  // Cancel subscription endpoint
  '/api/cancel-subscription': async (data) => {
    // This would call Stripe API to cancel subscription
    return {
      status: 'canceled',
      canceledAt: new Date().toISOString()
    }
  },

  // Update subscription endpoint
  '/api/update-subscription': async (data) => {
    // This would call Stripe API to update subscription
    return {
      status: 'updated',
      newTier: data.newTier,
      updatedAt: new Date().toISOString()
    }
  }
}
