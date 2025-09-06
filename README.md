# NourishAI - AI-Powered Personalized Nutrition Coach

NourishAI is a subscription-based platform that offers personalized diet plans tailored to individuals' health goals, preferences, allergies, and lifestyle using AI.

## 🌟 Features

### Core Features
- **AI-Driven Meal Recommendations**: Generates daily and weekly meal suggestions based on user data
- **Allergy & Preference Filtering**: Ensures meal plans exclude specified allergens and dietary restrictions
- **Time-Saving Recipe Generation**: Creates recipes matching user's available cooking time and skill level
- **Progress Tracking & Adjustments**: Monitors user progress and dynamically adjusts meal recommendations

### Subscription Tiers
- **Basic ($15/month)**: Standard meal plans, basic recipe library, allergy filtering
- **Premium ($25/month)**: Everything in Basic + progress tracking, meal adjustments, advanced analytics
- **Pro ($40/month)**: Everything in Premium + nutritionist consultation, custom requests, family planning

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend Services**: Supabase (Database & Auth)
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Payments**: Stripe
- **UI Components**: Lucide React icons, Recharts for analytics
- **Date Handling**: date-fns

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project
- OpenAI API key
- Stripe account (for payments)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vistara-apps/this-is-a-9053.git
   cd this-is-a-9053
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your API keys and configuration:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_OPENAI_API_KEY=your-openai-api-key
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   ```

4. **Set up Supabase database**
   
   Run these SQL commands in your Supabase SQL editor:

   ```sql
   -- Create user profiles table
   CREATE TABLE user_profiles (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     health_goals TEXT[],
     dietary_preferences TEXT[],
     allergies TEXT[],
     disliked_ingredients TEXT[],
     cooking_time_availability TEXT,
     cooking_skill_level TEXT,
     subscription_tier TEXT,
     subscription_expires_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create meal plans table
   CREATE TABLE meal_plans (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     plan_date DATE NOT NULL,
     meals JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create progress logs table
   CREATE TABLE progress_logs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     log_date DATE NOT NULL,
     weight DECIMAL,
     energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
     adherence_score INTEGER CHECK (adherence_score >= 1 AND adherence_score <= 10),
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
   ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own meal plans" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own meal plans" ON meal_plans FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own progress logs" ON progress_logs FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own progress logs" ON progress_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own progress logs" ON progress_logs FOR UPDATE USING (auth.uid() = user_id);
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── AppShell.jsx    # Main app layout
│   ├── Dashboard.jsx   # Main dashboard
│   ├── LandingPage.jsx # Landing page
│   ├── MealCard.jsx    # Meal display component
│   ├── ProgressTracker.jsx # Progress tracking
│   ├── RecipeInstructions.jsx # Recipe details
│   ├── SubscriptionPlans.jsx # Subscription tiers
│   └── UserProfileForm.jsx # User onboarding
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Authentication hook
│   └── useMealPlanning.js # Meal planning hook
├── services/           # API services
│   ├── openai.js       # OpenAI integration
│   ├── stripe.js       # Stripe payments
│   └── supabase.js     # Supabase database
├── utils/              # Utility functions
│   └── dateUtils.js    # Date manipulation
├── App.jsx             # Main app component
├── main.jsx           # App entry point
└── index.css          # Global styles
```

## 🎨 Design System

The app uses a custom design system with:

- **Colors**: Primary blue, accent yellow, neutral grays
- **Typography**: Sans-serif font family with 5 text scales
- **Spacing**: Consistent spacing scale (sm: 8px, md: 12px, lg: 20px, xl: 24px)
- **Border Radius**: Rounded corners (sm: 6px, md: 10px, lg: 16px)
- **Shadows**: Subtle card shadows for depth

## 🔧 Configuration

### OpenAI Integration
The app uses OpenAI's GPT-3.5-turbo model for:
- Generating personalized meal plans
- Creating detailed recipes
- Analyzing progress and suggesting adjustments

### Supabase Setup
Supabase provides:
- User authentication
- Database for user profiles, meal plans, and progress logs
- Row Level Security for data protection

### Stripe Integration
Stripe handles:
- Subscription management
- Payment processing
- Tier-based feature access

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_OPENAI_API_KEY` | OpenAI API key | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |

## 📱 User Flows

### 1. User Onboarding
1. User signs up with email/password
2. Completes profile questionnaire (goals, preferences, allergies)
3. Selects subscription tier
4. Completes payment via Stripe
5. Receives welcome message and initial meal plan

### 2. Daily Meal Planning
1. User logs in and views daily meal plan
2. Clicks on meal to view recipe details
3. Marks meals as completed or skipped
4. AI adjusts future recommendations based on feedback

### 3. Progress Tracking
1. User navigates to Progress section
2. Logs weight, energy levels, and adherence
3. Views progress charts and trends
4. Receives AI-generated plan adjustments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@nourishai.com or join our Discord community.

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- Supabase for the backend infrastructure
- Stripe for payment processing
- The React and Tailwind CSS communities
