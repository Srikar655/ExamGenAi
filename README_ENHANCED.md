# ExamGen AI - Enhanced Version

**Turn handwritten exam drafts into perfectly formatted digital question papers in minutes!**

This is the enhanced version of ExamGen AI with the following new features:
- 📊 **Dashboard** - View, manage, and load saved exam papers
- 🔒 **Secure Trial Limit** - 3 trials per user with atomic server-side counting
- 💬 **Feedback System** - Users can submit feedback, bug reports, and feature requests
- 🎯 **Landing Page** - Professional marketing landing page with smooth navigation

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Supabase Setup](#supabase-setup)
5. [Environment Variables](#environment-variables)
6. [Running Locally](#running-locally)
7. [Deployment](#deployment)
8. [Architecture](#architecture)
9. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites
- Node.js 16+ and npm/pnpm
- Supabase account (free tier available)
- Google Gemini API key
- Modern web browser

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Set Up Supabase Database
Follow the [Supabase Setup](#supabase-setup) section below to create tables and RPC functions.

### 4. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

Access the landing page at `http://localhost:5173/landing.html`

## Features

### 🎯 Core Features
- **AI-Powered OCR**: Gemini 2.5 reads handwritten exam papers
- **Smart Formatting**: Automatically formats questions, diagrams, and math
- **Vector Graphics**: Converts sketches to clean SVG diagrams
- **PDF Export**: Download formatted exam papers as PDF
- **Cloud Storage**: Save papers to Supabase database

### ✨ New Features in Enhanced Version

#### 1. Dashboard
- View all saved exam papers
- Load previous papers to edit
- Download papers as JSON
- Delete papers with confirmation
- Metadata display (class, subject, question count)

#### 2. Secure Trial Limit
- **3 trials per user** to prevent abuse
- **Server-side atomic counting** prevents race conditions
- Trial count persists across sessions
- Clear remaining trials display
- Graceful error handling when limit exceeded

#### 3. Feedback System
- Users can submit feedback, bug reports, and feature requests
- Feedback stored securely in database
- Email capture for follow-up
- Modal interface with smooth UX

#### 4. Landing Page
- Professional marketing landing page
- Hero section with clear value proposition
- How it works section (3-step process)
- Features showcase
- Tech stack display
- Call-to-action buttons
- Responsive design
- Smooth scrolling navigation

## Project Structure

```
examgen-ai-enhanced/
├── landing.html                 # Landing page (static HTML)
├── index.html                   # Main app entry point
├── index.tsx                    # React app entry point
├── App.tsx                      # Main app component with routing
├── Auth.tsx                     # Authentication component
│
├── components/
│   ├── Dashboard.tsx            # NEW: Dashboard view
│   ├── Feedback.tsx             # NEW: Feedback modal
│   ├── FileUpload.tsx           # File upload component
│   └── PaperRenderer.tsx        # Paper preview component
│
├── services/
│   ├── gemini.ts                # Gemini AI service
│   └── usageService.ts          # NEW: Trial limit service
│
├── lib/
│   └── supabase.ts              # Supabase client
│
├── types.ts                     # TypeScript type definitions
├── constants.ts                 # System prompts and constants
├── index.css                    # Global styles
│
├── SETUP_INSTRUCTIONS.md        # Detailed Supabase setup guide
├── README_ENHANCED.md           # This file
└── package.json                 # Dependencies
```

## Supabase Setup

### Step 1: Create Tables

Go to your Supabase project → SQL Editor and run the following SQL:

#### Create `user_usage` Table
```sql
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_count INT NOT NULL DEFAULT 0,
  last_trial_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);

ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON user_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can update usage"
  ON user_usage FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

#### Create `exam_papers` Table
```sql
CREATE TABLE IF NOT EXISTS exam_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  content JSONB NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_papers_user_id ON exam_papers(user_id);
CREATE INDEX idx_exam_papers_updated_at ON exam_papers(updated_at DESC);

ALTER TABLE exam_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own papers"
  ON exam_papers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own papers"
  ON exam_papers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own papers"
  ON exam_papers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own papers"
  ON exam_papers FOR DELETE
  USING (auth.uid() = user_id);
```

#### Create `feedback` Table
```sql
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved'))
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_status ON feedback(status);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);
```

### Step 2: Create RPC Functions

#### Create `check_and_increment_trial` Function
```sql
CREATE OR REPLACE FUNCTION check_and_increment_trial(
  p_user_id UUID,
  p_trial_limit INT DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
  v_trial_count INT;
  v_allowed BOOLEAN;
  v_remaining INT;
  v_message TEXT;
BEGIN
  SELECT trial_count INTO v_trial_count
  FROM user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO user_usage (user_id, trial_count, last_trial_date)
    VALUES (p_user_id, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    v_trial_count := 0;
  END IF;

  IF v_trial_count < p_trial_limit THEN
    v_allowed := true;
    v_remaining := p_trial_limit - v_trial_count - 1;
    
    UPDATE user_usage
    SET trial_count = trial_count + 1,
        last_trial_date = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    v_message := 'Trial allowed. ' || v_remaining || ' trials remaining.';
  ELSE
    v_allowed := false;
    v_remaining := 0;
    v_message := 'Trial limit exceeded. You have used all ' || p_trial_limit || ' trials.';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'message', v_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_and_increment_trial(UUID, INT) TO authenticated;
```

#### Create `reset_user_trials` Function (Optional)
```sql
CREATE OR REPLACE FUNCTION reset_user_trials(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_usage
  SET trial_count = 0,
      last_trial_date = NULL,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Trials reset successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reset_user_trials(UUID) TO authenticated;
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini API
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### Where to Find These Values

**Supabase URL & Anon Key:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy `Project URL` and `anon (public)` key

**Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Copy and paste in `.env.local`

## Running Locally

### Development Mode
```bash
npm run dev
```

This starts Vite dev server with hot module replacement.

**Landing Page:** http://localhost:5173/landing.html
**App:** http://localhost:5173/index.html

### Production Build
```bash
npm run build
```

Outputs optimized build to `dist/` directory.

### Preview Build
```bash
npm run preview
```

Serves the production build locally for testing.

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/examgen-ai.git
git push -u origin main
```

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

### Deploy to Netlify

1. **Build locally**
```bash
npm run build
```

2. **Deploy to Netlify**
   - Drag and drop `dist/` folder to Netlify
   - Or connect GitHub for automatic deployments
   - Add environment variables in Netlify dashboard

### Deploy to Other Platforms

The project can be deployed to any platform that supports Node.js and static files:
- AWS Amplify
- Firebase Hosting
- GitHub Pages (with build step)
- DigitalOcean
- Heroku

## Architecture

### Frontend Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Lucide React** - Icons

### Backend Services
- **Supabase** - Authentication, Database, RLS
- **Google Gemini 2.5** - AI OCR and analysis
- **Pollinations AI** - Image generation for diagrams

### Data Flow

```
User Upload
    ↓
Gemini AI Analysis (OCR)
    ↓
Check Trial Limit (RPC)
    ↓
Generate Structured JSON
    ↓
Display in Editor
    ↓
Save to Cloud (Supabase)
    ↓
Download as PDF/JSON
```

### Security Features

1. **Row Level Security (RLS)**
   - Users can only access their own data
   - Enforced at database level

2. **Atomic Trial Counting**
   - RPC function uses `FOR UPDATE` lock
   - Prevents race conditions
   - Server-side validation

3. **Authentication**
   - Supabase Auth with email/password
   - Session persistence
   - Secure logout

4. **Data Encryption**
   - All data encrypted in transit (HTTPS)
   - Sensitive data stored securely

## Troubleshooting

### RPC Function Not Found
**Error:** `check_and_increment_trial is not found`

**Solution:**
1. Verify function is created in Supabase SQL Editor
2. Check function name spelling exactly
3. Ensure you're using the correct Supabase project
4. Reload the page and try again

### Trial Limit Not Working
**Error:** Trial limit check fails or doesn't increment

**Solution:**
1. Verify `user_usage` table exists
2. Check RPC function is created
3. Verify RLS policies are correct
4. Check browser console for error messages
5. Ensure user is authenticated

### Feedback Not Saving
**Error:** Feedback submission fails silently

**Solution:**
1. Verify `feedback` table exists
2. Check RLS policies allow inserts
3. Ensure user is authenticated
4. Check browser console for errors
5. Verify Supabase connection

### Supabase Connection Error
**Error:** `Missing Supabase URL or Anon Key`

**Solution:**
1. Check `.env.local` file exists
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
3. Restart dev server after changing `.env.local`
4. Check for typos in environment variable names

### Gemini API Error
**Error:** `Failed to analyze exam sheet`

**Solution:**
1. Verify `VITE_GEMINI_API_KEY` is correct
2. Check API key is active in Google AI Studio
3. Verify API key has proper permissions
4. Check rate limits haven't been exceeded
5. Ensure images are valid format (JPG, PNG)

## Support & Contributing

For issues, questions, or feature requests:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)
3. Check browser console for error messages
4. Use the in-app Feedback feature to report issues

## License

This project is provided as-is for educational and commercial use.

## Credits

Built with:
- [Google Gemini API](https://ai.google.dev/)
- [Supabase](https://supabase.com/)
- [Pollinations AI](https://pollinations.ai/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

**Last Updated:** December 2024

**Version:** 2.0 (Enhanced)

Happy exam generating! 📚✨
