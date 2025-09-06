import { createClient } from '@supabase/supabase-js'

// These would normally be environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User management functions
export const authService = {
  // Sign up a new user
  async signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return { user: data.user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  },

  // Sign in existing user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return { user: data.user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  }
}

// User profile management
export const profileService = {
  // Create user profile
  async createProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          health_goals: profileData.healthGoals,
          dietary_preferences: profileData.dietaryPreferences,
          allergies: profileData.allergies,
          disliked_ingredients: profileData.dislikedIngredients,
          cooking_time_availability: profileData.cookingTimeAvailability,
          cooking_skill_level: profileData.cookingSkillLevel,
          subscription_tier: profileData.subscriptionTier,
          subscription_expires_at: profileData.subscriptionExpiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { profile: data, error: null }
    } catch (error) {
      return { profile: null, error: error.message }
    }
  },

  // Get user profile
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return { profile: data, error: null }
    } catch (error) {
      return { profile: null, error: error.message }
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return { profile: data, error: null }
    } catch (error) {
      return { profile: null, error: error.message }
    }
  }
}

// Meal plan management
export const mealPlanService = {
  // Save meal plan
  async saveMealPlan(userId, planDate, meals) {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert([{
          user_id: userId,
          plan_date: planDate,
          meals: meals,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { mealPlan: data, error: null }
    } catch (error) {
      return { mealPlan: null, error: error.message }
    }
  },

  // Get meal plan for date
  async getMealPlan(userId, planDate) {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_date', planDate)
        .single()

      if (error) throw error
      return { mealPlan: data, error: null }
    } catch (error) {
      return { mealPlan: null, error: error.message }
    }
  },

  // Get meal plans for date range
  async getMealPlans(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .gte('plan_date', startDate)
        .lte('plan_date', endDate)
        .order('plan_date', { ascending: true })

      if (error) throw error
      return { mealPlans: data, error: null }
    } catch (error) {
      return { mealPlans: [], error: error.message }
    }
  }
}

// Progress tracking
export const progressService = {
  // Log progress entry
  async logProgress(userId, progressData) {
    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .insert([{
          user_id: userId,
          log_date: progressData.logDate,
          weight: progressData.weight,
          energy_level: progressData.energyLevel,
          adherence_score: progressData.adherenceScore,
          notes: progressData.notes,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { progressLog: data, error: null }
    } catch (error) {
      return { progressLog: null, error: error.message }
    }
  },

  // Get progress logs
  async getProgressLogs(userId, limit = 30) {
    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { progressLogs: data, error: null }
    } catch (error) {
      return { progressLogs: [], error: error.message }
    }
  },

  // Get latest progress entry
  async getLatestProgress(userId) {
    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return { progressLog: data, error: null }
    } catch (error) {
      return { progressLog: null, error: error.message }
    }
  }
}
