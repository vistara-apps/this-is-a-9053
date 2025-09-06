# NourishAI Deployment Guide

This guide covers the complete deployment process for NourishAI, from development to production.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   OpenAI API    │
│   (React/Vite)  │◄──►│   (Database)    │    │   (AI Service)  │
│                 │    │   (Auth)        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              
         ▼                                              
┌─────────────────┐                                     
│   Stripe API    │                                     
│   (Payments)    │                                     
└─────────────────┘                                     
```

## 🚀 Production Deployment

### 1. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Database Schema
Run this SQL in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meals JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

-- Create progress logs table
CREATE TABLE progress_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  weight DECIMAL,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  adherence_score INTEGER CHECK (adherence_score >= 1 AND adherence_score <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meal plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress logs" ON progress_logs
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_date ON meal_plans(plan_date);
CREATE INDEX idx_progress_logs_user_id ON progress_logs(user_id);
CREATE INDEX idx_progress_logs_date ON progress_logs(log_date);
```

#### Authentication Settings
1. Go to Authentication > Settings
2. Enable email confirmations (optional)
3. Set up email templates
4. Configure redirect URLs for your domain

### 2. OpenAI Setup

1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key
3. Set usage limits and billing alerts
4. Test API access

### 3. Stripe Setup

#### Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Get publishable and secret keys

#### Create Products and Prices
```javascript
// Use Stripe CLI or Dashboard to create products
stripe products create --name="NourishAI Basic" --description="Basic meal planning features"
stripe prices create --product=prod_xxx --unit-amount=1500 --currency=usd --recurring[interval]=month

stripe products create --name="NourishAI Premium" --description="Advanced meal planning with progress tracking"
stripe prices create --product=prod_xxx --unit-amount=2500 --currency=usd --recurring[interval]=month

stripe products create --name="NourishAI Pro" --description="Complete nutrition coaching with expert consultation"
stripe prices create --product=prod_xxx --unit-amount=4000 --currency=usd --recurring[interval]=month
```

#### Webhook Setup
1. Create webhook endpoint in Stripe Dashboard
2. Add your domain: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Note the webhook secret

### 4. Environment Variables

Create production environment variables:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# OpenAI
VITE_OPENAI_API_KEY=your-production-openai-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-live-publishable-key

# App
VITE_APP_NAME=NourishAI
VITE_APP_URL=https://yourdomain.com
```

### 5. Frontend Deployment

#### Option A: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard
   - Add all environment variables
   - Redeploy

#### Option B: Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag `dist/` folder to Netlify
   - Or connect GitHub repository
   - Configure environment variables
   - Set build command: `npm run build`
   - Set publish directory: `dist`

#### Option C: AWS S3 + CloudFront

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Create S3 bucket**
   ```bash
   aws s3 mb s3://nourishai-frontend
   aws s3 sync dist/ s3://nourishai-frontend --delete
   ```

3. **Configure CloudFront distribution**
   - Point to S3 bucket
   - Configure custom domain
   - Enable HTTPS

### 6. Backend API (Optional)

For production, consider creating a backend API to:
- Handle Stripe webhooks securely
- Manage OpenAI API calls server-side
- Implement rate limiting
- Add analytics and monitoring

#### Express.js Backend Example

```javascript
// server.js
const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

const app = express()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// Stripe webhook handler
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle subscription events
  switch (event.type) {
    case 'customer.subscription.created':
      // Update user subscription in database
      break
    case 'customer.subscription.updated':
      // Update subscription status
      break
    case 'customer.subscription.deleted':
      // Handle cancellation
      break
  }

  res.json({received: true})
})

app.listen(3000)
```

## 🔒 Security Considerations

### 1. API Keys
- Never expose secret keys in frontend code
- Use environment variables
- Rotate keys regularly
- Set up monitoring for unusual usage

### 2. Database Security
- Enable Row Level Security (RLS)
- Use least-privilege access
- Regular security audits
- Monitor for suspicious activity

### 3. Authentication
- Enable email verification
- Implement rate limiting
- Use strong password policies
- Consider 2FA for admin accounts

### 4. HTTPS
- Always use HTTPS in production
- Configure HSTS headers
- Use secure cookies
- Implement CSP headers

## 📊 Monitoring & Analytics

### 1. Application Monitoring
- Set up error tracking (Sentry)
- Monitor API response times
- Track user engagement
- Set up uptime monitoring

### 2. Database Monitoring
- Monitor query performance
- Set up connection pooling
- Track storage usage
- Monitor for slow queries

### 3. Business Metrics
- Track subscription conversions
- Monitor churn rates
- Analyze feature usage
- Track AI API costs

## 🚀 Performance Optimization

### 1. Frontend Optimization
- Enable gzip compression
- Implement code splitting
- Optimize images
- Use CDN for static assets

### 2. Database Optimization
- Add appropriate indexes
- Implement connection pooling
- Use read replicas if needed
- Monitor query performance

### 3. API Optimization
- Implement caching
- Use rate limiting
- Optimize AI prompts
- Batch API requests

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_OPENAI_API_KEY: ${{ secrets.VITE_OPENAI_API_KEY }}
          VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Configure Supabase CORS settings
   - Check API endpoint URLs

2. **Authentication Issues**
   - Verify Supabase configuration
   - Check redirect URLs

3. **Payment Failures**
   - Verify Stripe keys
   - Check webhook configuration

4. **AI API Errors**
   - Monitor OpenAI usage limits
   - Implement fallback responses

### Monitoring Commands

```bash
# Check application logs
vercel logs

# Monitor database performance
# Use Supabase dashboard

# Check API usage
# Monitor OpenAI and Stripe dashboards
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review service status pages
3. Contact support teams
4. Join community forums

Remember to test thoroughly in a staging environment before deploying to production!
