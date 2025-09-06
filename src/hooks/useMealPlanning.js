import { useState, useEffect, useCallback } from 'react'
import { mealPlanService } from '../services/supabase'
import { aiService } from '../services/openai'
import { dateUtils } from '../utils/dateUtils'

export const useMealPlanning = (userId, userProfile) => {
  const [mealPlans, setMealPlans] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)

  // Load meal plans for a date range
  const loadMealPlans = useCallback(async (startDate, endDate) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const { mealPlans: plans, error } = await mealPlanService.getMealPlans(
        userId,
        dateUtils.formatDateForAPI(startDate),
        dateUtils.formatDateForAPI(endDate)
      )

      if (error) {
        throw new Error(error)
      }

      // Convert array to object keyed by date
      const plansMap = {}
      plans.forEach(plan => {
        plansMap[plan.plan_date] = plan
      })

      setMealPlans(prev => ({ ...prev, ...plansMap }))
    } catch (err) {
      console.error('Error loading meal plans:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Generate AI meal plan for a specific date
  const generateMealPlan = useCallback(async (targetDate) => {
    if (!userId || !userProfile) return

    try {
      setGeneratingPlan(true)
      setError(null)

      const dateKey = dateUtils.formatDateForAPI(targetDate)

      // Get previous meals to avoid repetition
      const previousDates = dateUtils.getPreviousDays(7, targetDate)
      const previousMeals = []

      for (const date of previousDates) {
        const dateKey = dateUtils.formatDateForAPI(date)
        const plan = mealPlans[dateKey]
        if (plan && plan.meals) {
          Object.values(plan.meals).forEach(meal => {
            if (meal && meal.name) {
              previousMeals.push(meal)
            }
          })
        }
      }

      // Generate new meal plan using AI
      const aiMealPlan = await aiService.generateMealPlan(
        userProfile,
        dateKey,
        previousMeals
      )

      // Save to database
      const { mealPlan, error } = await mealPlanService.saveMealPlan(
        userId,
        dateKey,
        aiMealPlan
      )

      if (error) {
        throw new Error(error)
      }

      // Update local state
      setMealPlans(prev => ({
        ...prev,
        [dateKey]: mealPlan
      }))

      return mealPlan
    } catch (err) {
      console.error('Error generating meal plan:', err)
      setError(err.message)
      throw err
    } finally {
      setGeneratingPlan(false)
    }
  }, [userId, userProfile, mealPlans])

  // Get meal plan for a specific date
  const getMealPlan = useCallback((date) => {
    const dateKey = dateUtils.formatDateForAPI(date)
    return mealPlans[dateKey] || null
  }, [mealPlans])

  // Mark meal as completed
  const markMealCompleted = useCallback(async (date, mealType, completed = true) => {
    const dateKey = dateUtils.formatDateForAPI(date)
    const currentPlan = mealPlans[dateKey]

    if (!currentPlan) return

    const updatedMeals = {
      ...currentPlan.meals,
      [mealType]: {
        ...currentPlan.meals[mealType],
        completed,
        completedAt: completed ? new Date().toISOString() : null
      }
    }

    try {
      // Update in database (this would need a new service method)
      // For now, just update local state
      setMealPlans(prev => ({
        ...prev,
        [dateKey]: {
          ...currentPlan,
          meals: updatedMeals
        }
      }))
    } catch (err) {
      console.error('Error marking meal completed:', err)
      setError(err.message)
    }
  }, [mealPlans])

  // Get meal completion stats for a date range
  const getMealStats = useCallback((startDate, endDate) => {
    const dates = dateUtils.getNextDays(
      dateUtils.getDaysBetween(startDate, endDate) + 1,
      startDate
    )

    let totalMeals = 0
    let completedMeals = 0
    let totalCalories = 0
    let consumedCalories = 0

    dates.forEach(date => {
      const dateKey = dateUtils.formatDateForAPI(date)
      const plan = mealPlans[dateKey]

      if (plan && plan.meals) {
        Object.values(plan.meals).forEach(meal => {
          if (meal && meal.name) {
            totalMeals++
            totalCalories += meal.calories || 0

            if (meal.completed) {
              completedMeals++
              consumedCalories += meal.calories || 0
            }
          }
        })
      }
    })

    return {
      totalMeals,
      completedMeals,
      adherenceRate: totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0,
      totalCalories,
      consumedCalories,
      calorieAdherence: totalCalories > 0 ? (consumedCalories / totalCalories) * 100 : 0
    }
  }, [mealPlans])

  // Get today's meal plan
  const getTodaysMealPlan = useCallback(() => {
    return getMealPlan(new Date())
  }, [getMealPlan])

  // Get this week's meal plans
  const getWeekMealPlans = useCallback((weekStartDate = new Date()) => {
    const weekDates = dateUtils.getWeekDates(weekStartDate)
    return weekDates.map(date => ({
      date,
      plan: getMealPlan(date),
      dateKey: dateUtils.formatDateForAPI(date)
    }))
  }, [getMealPlan])

  // Check if meal plan exists for date
  const hasMealPlan = useCallback((date) => {
    const dateKey = dateUtils.formatDateForAPI(date)
    return !!mealPlans[dateKey]
  }, [mealPlans])

  // Generate meal plans for multiple dates
  const generateWeekMealPlans = useCallback(async (startDate) => {
    const weekDates = dateUtils.getWeekDates(startDate)
    const results = []

    for (const date of weekDates) {
      if (!hasMealPlan(date)) {
        try {
          const plan = await generateMealPlan(date)
          results.push({ date, plan, success: true })
        } catch (err) {
          results.push({ date, plan: null, success: false, error: err.message })
        }
      } else {
        results.push({ date, plan: getMealPlan(date), success: true, skipped: true })
      }
    }

    return results
  }, [generateMealPlan, hasMealPlan, getMealPlan])

  // Load initial data
  useEffect(() => {
    if (userId) {
      const today = new Date()
      const weekStart = dateUtils.getWeekDates(today)[0]
      const weekEnd = dateUtils.getWeekDates(today)[6]
      loadMealPlans(weekStart, weekEnd)
    }
  }, [userId, loadMealPlans])

  return {
    mealPlans,
    loading,
    error,
    generatingPlan,
    loadMealPlans,
    generateMealPlan,
    getMealPlan,
    markMealCompleted,
    getMealStats,
    getTodaysMealPlan,
    getWeekMealPlans,
    hasMealPlan,
    generateWeekMealPlans,
    clearError: () => setError(null)
  }
}
