import React, { useState, useEffect } from 'react'
import { Clock, Users, ChefHat, Star, CheckCircle, Circle, ArrowLeft, Heart, Share2 } from 'lucide-react'
import { aiService } from '../services/openai'

const RecipeInstructions = ({ meal, onBack, userProfile }) => {
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [isFavorited, setIsFavorited] = useState(false)
  const [activeTab, setActiveTab] = useState('instructions')

  useEffect(() => {
    if (meal && !meal.detailedRecipe) {
      loadRecipeDetails()
    } else if (meal && meal.detailedRecipe) {
      setRecipe(meal.detailedRecipe)
    }
  }, [meal])

  const loadRecipeDetails = async () => {
    if (!meal) return

    try {
      setLoading(true)
      setError(null)

      const dietaryRestrictions = [
        ...(userProfile?.allergies || []),
        ...(userProfile?.dietaryPreferences || [])
      ]

      const detailedRecipe = await aiService.generateRecipeDetails(
        meal.name,
        dietaryRestrictions,
        userProfile?.cookingTimeAvailability || '30 min',
        userProfile?.cookingSkillLevel || 'medium'
      )

      setRecipe(detailedRecipe)
    } catch (err) {
      console.error('Error loading recipe details:', err)
      setError('Failed to load recipe details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleStepCompletion = (stepIndex) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleShare = async () => {
    if (navigator.share && recipe) {
      try {
        await navigator.share({
          title: recipe.name,
          text: `Check out this ${recipe.name} recipe from NourishAI!`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Recipe link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="flex items-center text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Meals
            </button>
          </div>
          
          <div className="card animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="flex items-center text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Meals
            </button>
          </div>
          
          <div className="card text-center">
            <div className="text-red-500 mb-4">
              <ChefHat className="w-12 h-12 mx-auto mb-2" />
              <h2 className="heading2">Recipe Not Available</h2>
            </div>
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              onClick={loadRecipeDetails}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentRecipe = recipe || meal

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-surface shadow-sm border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Meals
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-gray-400 hover:text-primary transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
            <div className="flex-1">
              <h1 className="display mb-2">{currentRecipe.name}</h1>
              <p className="body text-text-secondary mb-4">{currentRecipe.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center text-text-secondary">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {currentRecipe.prepTime} prep + {currentRecipe.cookTime} cook
                  </span>
                </div>
                
                <div className="flex items-center text-text-secondary">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-sm">{currentRecipe.servings || 2} servings</span>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentRecipe.difficulty)}`}>
                  {currentRecipe.difficulty || 'Medium'}
                </span>
              </div>
            </div>

            {/* Nutrition Info */}
            <div className="bg-gray-50 rounded-lg p-4 min-w-[200px]">
              <h3 className="font-semibold mb-3">Nutrition per serving</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Calories</span>
                  <span className="font-medium">{currentRecipe.calories || meal.calories}</span>
                </div>
                {currentRecipe.protein && (
                  <div className="flex justify-between">
                    <span>Protein</span>
                    <span className="font-medium">{currentRecipe.protein}</span>
                  </div>
                )}
                {currentRecipe.carbs && (
                  <div className="flex justify-between">
                    <span>Carbs</span>
                    <span className="font-medium">{currentRecipe.carbs}</span>
                  </div>
                )}
                {currentRecipe.fat && (
                  <div className="flex justify-between">
                    <span>Fat</span>
                    <span className="font-medium">{currentRecipe.fat}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'instructions'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Instructions
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ingredients'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Ingredients
          </button>
          {currentRecipe.tips && (
            <button
              onClick={() => setActiveTab('tips')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'tips'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Tips
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'instructions' && (
          <div className="card">
            <h2 className="heading2 mb-4">Instructions</h2>
            <div className="space-y-4">
              {(currentRecipe.instructions || meal.instructions || []).map((instruction, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                    completedSteps.has(index) ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => toggleStepCompletion(index)}
                    className="flex-shrink-0 mt-1"
                  >
                    {completedSteps.has(index) ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-medium text-primary mr-2">
                        Step {index + 1}
                      </span>
                    </div>
                    <p className={`body ${completedSteps.has(index) ? 'line-through text-text-secondary' : ''}`}>
                      {instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-accent/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Progress</span>
                <span className="text-sm text-text-secondary">
                  {completedSteps.size} of {(currentRecipe.instructions || meal.instructions || []).length} steps
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((completedSteps.size / (currentRecipe.instructions || meal.instructions || []).length) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="card">
            <h2 className="heading2 mb-4">Ingredients</h2>
            <div className="grid gap-3">
              {(currentRecipe.ingredients || meal.ingredients || []).map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                  <span className="body">{ingredient}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tips' && currentRecipe.tips && (
          <div className="card">
            <h2 className="heading2 mb-4">Chef's Tips</h2>
            <div className="space-y-3">
              {currentRecipe.tips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="body text-blue-900">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeInstructions
