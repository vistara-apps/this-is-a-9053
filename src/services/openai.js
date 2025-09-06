import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key',
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
})

export const aiService = {
  // Generate personalized meal recommendations
  async generateMealPlan(userProfile, targetDate, previousMeals = []) {
    try {
      const prompt = this.buildMealPlanPrompt(userProfile, targetDate, previousMeals)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional nutritionist and meal planning expert. Generate personalized, healthy meal recommendations based on user preferences, dietary restrictions, and health goals. Always provide practical, achievable recipes with clear instructions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })

      const response = completion.choices[0].message.content
      return this.parseMealPlanResponse(response)
    } catch (error) {
      console.error('Error generating meal plan:', error)
      return this.getFallbackMealPlan(userProfile)
    }
  },

  // Generate recipe details for a specific meal
  async generateRecipeDetails(mealName, dietaryRestrictions = [], cookingTime = '30 min', skillLevel = 'medium') {
    try {
      const prompt = `Create a detailed recipe for "${mealName}" with the following requirements:
      - Dietary restrictions: ${dietaryRestrictions.join(', ') || 'None'}
      - Maximum cooking time: ${cookingTime}
      - Skill level: ${skillLevel}
      
      Please provide:
      1. Ingredient list with quantities
      2. Step-by-step instructions
      3. Nutritional information (calories, protein, carbs, fat)
      4. Prep time and cook time
      5. Serving size
      
      Format the response as JSON with the following structure:
      {
        "name": "Recipe Name",
        "description": "Brief description",
        "servings": 2,
        "prepTime": "15 min",
        "cookTime": "20 min",
        "difficulty": "Easy/Medium/Hard",
        "calories": 450,
        "protein": "25g",
        "carbs": "30g",
        "fat": "15g",
        "ingredients": ["ingredient 1", "ingredient 2"],
        "instructions": ["step 1", "step 2"],
        "tips": ["tip 1", "tip 2"]
      }`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional chef and nutritionist. Provide detailed, accurate recipes in the requested JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })

      const response = completion.choices[0].message.content
      return JSON.parse(response)
    } catch (error) {
      console.error('Error generating recipe details:', error)
      return this.getFallbackRecipe(mealName)
    }
  },

  // Analyze progress and suggest meal plan adjustments
  async analyzePlanAdjustments(userProfile, progressLogs, currentMealPlan) {
    try {
      const prompt = `As a nutrition expert, analyze the following user data and suggest meal plan adjustments:

      User Profile:
      - Health Goals: ${userProfile.healthGoals?.join(', ')}
      - Dietary Preferences: ${userProfile.dietaryPreferences?.join(', ')}
      - Allergies: ${userProfile.allergies?.join(', ')}
      
      Recent Progress (last 7 entries):
      ${progressLogs.slice(0, 7).map(log => 
        `Date: ${log.log_date}, Weight: ${log.weight}kg, Energy: ${log.energy_level}/10, Adherence: ${log.adherence_score}/10`
      ).join('\n')}
      
      Current Meal Plan Pattern:
      ${JSON.stringify(currentMealPlan, null, 2)}
      
      Please provide:
      1. Analysis of progress trends
      2. Specific adjustments needed (calories, macros, meal types)
      3. Recommended changes for next week
      4. Motivational feedback
      
      Format as JSON:
      {
        "analysis": "Progress analysis",
        "adjustments": {
          "calories": "adjustment needed",
          "protein": "adjustment needed",
          "carbs": "adjustment needed",
          "mealTypes": ["suggested changes"]
        },
        "recommendations": ["recommendation 1", "recommendation 2"],
        "motivation": "Encouraging message"
      }`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert nutritionist analyzing user progress and providing personalized recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1000
      })

      const response = completion.choices[0].message.content
      return JSON.parse(response)
    } catch (error) {
      console.error('Error analyzing plan adjustments:', error)
      return this.getFallbackAdjustments()
    }
  },

  // Build meal plan prompt based on user profile
  buildMealPlanPrompt(userProfile, targetDate, previousMeals) {
    return `Generate a full day meal plan for ${targetDate} with the following user requirements:

    Health Goals: ${userProfile.healthGoals?.join(', ') || 'General health'}
    Dietary Preferences: ${userProfile.dietaryPreferences?.join(', ') || 'No specific preferences'}
    Allergies/Restrictions: ${userProfile.allergies?.join(', ') || 'None'}
    Disliked Ingredients: ${userProfile.dislikedIngredients?.join(', ') || 'None'}
    Available Cooking Time: ${userProfile.cookingTimeAvailability || '30 minutes'}
    Cooking Skill Level: ${userProfile.cookingSkillLevel || 'Medium'}
    
    Previous meals to avoid repetition:
    ${previousMeals.length > 0 ? previousMeals.map(meal => `- ${meal.name}`).join('\n') : 'None'}
    
    Please provide a JSON response with breakfast, lunch, dinner, and 2 snacks:
    {
      "breakfast": {
        "name": "Meal Name",
        "description": "Brief description",
        "calories": 300,
        "prepTime": "10 min",
        "cookTime": "5 min",
        "difficulty": "Easy",
        "ingredients": ["ingredient1", "ingredient2"],
        "instructions": ["step1", "step2"]
      },
      "lunch": { ... },
      "dinner": { ... },
      "snack1": { ... },
      "snack2": { ... }
    }
    
    Ensure all meals:
    - Avoid specified allergies and dislikes
    - Fit within cooking time constraints
    - Match skill level
    - Support health goals
    - Provide balanced nutrition`
  },

  // Parse AI response into structured meal plan
  parseMealPlanResponse(response) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      // If JSON parsing fails, extract meal information using regex
      console.warn('Failed to parse JSON response, using fallback parsing')
      return this.extractMealDataFromText(response)
    }
  },

  // Extract meal data from text response (fallback)
  extractMealDataFromText(text) {
    // This is a simplified fallback - in production you'd want more robust parsing
    const meals = {
      breakfast: this.extractMealFromText(text, 'breakfast'),
      lunch: this.extractMealFromText(text, 'lunch'),
      dinner: this.extractMealFromText(text, 'dinner'),
      snack1: this.extractMealFromText(text, 'snack'),
      snack2: this.extractMealFromText(text, 'snack', 2)
    }
    return meals
  },

  // Extract individual meal from text
  extractMealFromText(text, mealType, occurrence = 1) {
    // Simplified extraction - would need more sophisticated parsing in production
    return {
      name: `AI-Generated ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
      description: 'Personalized meal recommendation',
      calories: 350,
      prepTime: '15 min',
      cookTime: '20 min',
      difficulty: 'Medium',
      ingredients: ['Various healthy ingredients'],
      instructions: ['Follow AI-generated instructions']
    }
  },

  // Fallback meal plan when AI fails
  getFallbackMealPlan(userProfile) {
    const isVegetarian = userProfile.dietaryPreferences?.includes('vegetarian')
    const isVegan = userProfile.dietaryPreferences?.includes('vegan')
    
    return {
      breakfast: {
        name: isVegan ? 'Overnight Oats with Berries' : 'Greek Yogurt Parfait',
        description: isVegan ? 'Creamy oats with fresh berries and nuts' : 'Protein-rich yogurt with fruits and granola',
        calories: 320,
        prepTime: '5 min',
        cookTime: '0 min',
        difficulty: 'Easy',
        ingredients: isVegan ? ['Rolled oats', 'Almond milk', 'Berries', 'Nuts'] : ['Greek yogurt', 'Berries', 'Granola', 'Honey'],
        instructions: ['Mix ingredients', 'Let sit overnight', 'Enjoy cold']
      },
      lunch: {
        name: 'Mediterranean Quinoa Bowl',
        description: 'Nutritious quinoa with vegetables and healthy fats',
        calories: 450,
        prepTime: '15 min',
        cookTime: '15 min',
        difficulty: 'Medium',
        ingredients: ['Quinoa', 'Cucumber', 'Tomatoes', 'Olive oil', 'Lemon'],
        instructions: ['Cook quinoa', 'Chop vegetables', 'Mix with dressing', 'Serve fresh']
      },
      dinner: {
        name: isVegetarian ? 'Lentil Curry' : 'Grilled Chicken with Vegetables',
        description: isVegetarian ? 'Protein-rich lentils in aromatic spices' : 'Lean protein with colorful vegetables',
        calories: 520,
        prepTime: '20 min',
        cookTime: '25 min',
        difficulty: 'Medium',
        ingredients: isVegetarian ? ['Red lentils', 'Coconut milk', 'Spices', 'Vegetables'] : ['Chicken breast', 'Mixed vegetables', 'Herbs', 'Olive oil'],
        instructions: ['Prepare ingredients', 'Cook main protein', 'Add vegetables', 'Season and serve']
      },
      snack1: {
        name: 'Apple with Almond Butter',
        description: 'Simple, satisfying snack with healthy fats',
        calories: 180,
        prepTime: '2 min',
        cookTime: '0 min',
        difficulty: 'Easy',
        ingredients: ['Apple', 'Almond butter'],
        instructions: ['Slice apple', 'Serve with almond butter']
      },
      snack2: {
        name: 'Hummus with Vegetables',
        description: 'Protein-rich dip with fresh vegetables',
        calories: 150,
        prepTime: '5 min',
        cookTime: '0 min',
        difficulty: 'Easy',
        ingredients: ['Hummus', 'Carrots', 'Cucumber', 'Bell peppers'],
        instructions: ['Cut vegetables', 'Serve with hummus']
      }
    }
  },

  // Fallback recipe when AI fails
  getFallbackRecipe(mealName) {
    return {
      name: mealName,
      description: 'A healthy, balanced meal',
      servings: 2,
      prepTime: '15 min',
      cookTime: '20 min',
      difficulty: 'Medium',
      calories: 400,
      protein: '20g',
      carbs: '35g',
      fat: '12g',
      ingredients: ['Main ingredient', 'Vegetables', 'Seasonings', 'Healthy fats'],
      instructions: ['Prepare ingredients', 'Cook main components', 'Combine and season', 'Serve hot'],
      tips: ['Use fresh ingredients when possible', 'Adjust seasoning to taste']
    }
  },

  // Fallback adjustments when AI fails
  getFallbackAdjustments() {
    return {
      analysis: 'Based on your recent progress, you\'re doing well! Keep up the good work.',
      adjustments: {
        calories: 'Maintain current calorie intake',
        protein: 'Continue with adequate protein',
        carbs: 'Focus on complex carbohydrates',
        mealTypes: ['Include more vegetables', 'Stay hydrated']
      },
      recommendations: [
        'Continue with your current meal plan',
        'Add variety with seasonal ingredients',
        'Listen to your body\'s hunger cues'
      ],
      motivation: 'You\'re making great progress! Consistency is key to reaching your health goals.'
    }
  }
}
