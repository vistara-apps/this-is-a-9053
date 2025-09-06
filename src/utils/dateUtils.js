import { format, addDays, subDays, startOfWeek, endOfWeek, isToday, isTomorrow, isYesterday } from 'date-fns'

export const dateUtils = {
  // Format date for display
  formatDate(date, formatString = 'MMM dd, yyyy') {
    return format(new Date(date), formatString)
  },

  // Format date for API calls
  formatDateForAPI(date) {
    return format(new Date(date), 'yyyy-MM-dd')
  },

  // Get relative date description
  getRelativeDateDescription(date) {
    const targetDate = new Date(date)
    
    if (isToday(targetDate)) {
      return 'Today'
    } else if (isTomorrow(targetDate)) {
      return 'Tomorrow'
    } else if (isYesterday(targetDate)) {
      return 'Yesterday'
    } else {
      return this.formatDate(targetDate, 'EEE, MMM dd')
    }
  },

  // Get week dates
  getWeekDates(date = new Date()) {
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 }) // Sunday
    
    const dates = []
    let currentDate = start
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }
    
    return dates
  },

  // Get next N days
  getNextDays(count = 7, startDate = new Date()) {
    const dates = []
    let currentDate = new Date(startDate)
    
    for (let i = 0; i < count; i++) {
      dates.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }
    
    return dates
  },

  // Get previous N days
  getPreviousDays(count = 7, endDate = new Date()) {
    const dates = []
    let currentDate = new Date(endDate)
    
    for (let i = 0; i < count; i++) {
      dates.unshift(new Date(currentDate))
      currentDate = subDays(currentDate, 1)
    }
    
    return dates
  },

  // Check if date is in range
  isDateInRange(date, startDate, endDate) {
    const target = new Date(date)
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return target >= start && target <= end
  },

  // Get days between dates
  getDaysBetween(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  },

  // Get meal time slots for a day
  getMealTimeSlots() {
    return [
      { key: 'breakfast', name: 'Breakfast', time: '8:00 AM', icon: '🌅' },
      { key: 'snack1', name: 'Morning Snack', time: '10:30 AM', icon: '🍎' },
      { key: 'lunch', name: 'Lunch', time: '12:30 PM', icon: '☀️' },
      { key: 'snack2', name: 'Afternoon Snack', time: '3:30 PM', icon: '🥜' },
      { key: 'dinner', name: 'Dinner', time: '7:00 PM', icon: '🌙' }
    ]
  },

  // Get current meal time
  getCurrentMealTime() {
    const now = new Date()
    const hour = now.getHours()
    
    if (hour < 10) return 'breakfast'
    if (hour < 12) return 'snack1'
    if (hour < 15) return 'lunch'
    if (hour < 18) return 'snack2'
    return 'dinner'
  },

  // Get next meal time
  getNextMealTime() {
    const current = this.getCurrentMealTime()
    const slots = this.getMealTimeSlots()
    const currentIndex = slots.findIndex(slot => slot.key === current)
    
    if (currentIndex === -1 || currentIndex === slots.length - 1) {
      return slots[0] // Next day's breakfast
    }
    
    return slots[currentIndex + 1]
  }
}
