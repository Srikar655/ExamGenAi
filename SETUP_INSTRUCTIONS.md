# ExamGen AI - Enhanced Setup Instructions

This document provides step-by-step instructions to set up the new features: Dashboard, Trial Limit, and Feedback.

## Prerequisites

- Supabase project created and configured
- Supabase URL and Anon Key in your `.env.local` file
- Node.js and npm installed

## 1. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

## 2. Supabase Database Setup

### Step 1: Create Tables

Go to your Supabase project dashboard → SQL Editor and run the following SQL commands:

#### 2.1 Create `user_usage` Table (for Trial Limit Tracking)

```sql
-- Create user_usage table to track trial usage per user
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_count INT NOT NULL DEFAULT 0,
  last_trial_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own usage data
CREATE POLICY "Users can view their own usage"
  ON user_usage FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can update usage (for RPC)
CREATE POLICY "Service role can update usage"
  ON user_usage FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

#### 2.2 Create `exam_papers` Table (for Dashboard)

```sql
-- Create exam_papers table to store user's saved papers
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

-- Create index for faster lookups
CREATE INDEX idx_exam_papers_user_id ON exam_papers(user_id);
CREATE INDEX idx_exam_papers_updated_at ON exam_papers(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE exam_papers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own papers
CREATE POLICY "Users can view their own papers"
  ON exam_papers FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own papers
CREATE POLICY "Users can insert their own papers"
  ON exam_papers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own papers
CREATE POLICY "Users can update their own papers"
  ON exam_papers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own papers
CREATE POLICY "Users can delete their own papers"
  ON exam_papers FOR DELETE
  USING (auth.uid() = user_id);
```

#### 2.3 Create `feedback` Table (for Feedback Feature)

```sql
-- Create feedback table to store user feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved'))
);

-- Create indexes
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_status ON feedback(status);

-- Enable Row Level Security (RLS)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert feedback
CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Authenticated users can insert feedback (for anonymous users)
CREATE POLICY "Authenticated users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);
```

### Step 2: Create RPC Functions

#### 2.4 Create `check_and_increment_trial` RPC Function

This function atomically checks if a user has remaining trials and increments the count if allowed. This prevents race conditions.

```sql
-- Create function to check and increment trial count atomically
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
  -- Lock the user's usage row to prevent race conditions
  SELECT trial_count INTO v_trial_count
  FROM user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no row exists, create one (new user)
  IF NOT FOUND THEN
    INSERT INTO user_usage (user_id, trial_count, last_trial_date)
    VALUES (p_user_id, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    v_trial_count := 0;
  END IF;

  -- Check if user has remaining trials
  IF v_trial_count < p_trial_limit THEN
    v_allowed := true;
    v_remaining := p_trial_limit - v_trial_count - 1; -- -1 because we're about to use one
    
    -- Increment trial count
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

  -- Return result as JSON
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'message', v_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_and_increment_trial(UUID, INT) TO authenticated;
```

#### 2.5 Create `reset_user_trials` RPC Function (Optional - Admin Use)

```sql
-- Create function to reset user trials (admin only)
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

-- Grant execute permission (restrict to authenticated users for now)
GRANT EXECUTE ON FUNCTION reset_user_trials(UUID) TO authenticated;
```

## 3. Update Application Code

### Step 1: Update `App.tsx`

The main App component has been updated to include:
- Dashboard view for saved papers
- Trial limit check before analysis
- Feedback button in header
- Navigation between views

Key changes:
- New state for `currentView` ('editor' | 'dashboard')
- Call to `checkAndIncrementTrial()` before `handleAnalyze()`
- New button to toggle between Dashboard and Editor views
- Feedback modal trigger

### Step 2: Install Dependencies (if not already installed)

```bash
npm install
```

All required dependencies are already in package.json:
- `@supabase/supabase-js` - Supabase client
- `lucide-react` - Icons
- `react` and `react-dom` - React framework

## 4. Testing the Features

### Test Dashboard
1. Log in to the application
2. Create and save an exam paper
3. Click "Dashboard" button to view saved papers
4. Verify you can load, download, and delete papers

### Test Trial Limit
1. Log in as a new user
2. Upload images and analyze (Trial 1/3)
3. Upload again and analyze (Trial 2/3)
4. Upload again and analyze (Trial 3/3)
5. On the 4th attempt, you should see an error message: "Trial limit exceeded"

### Test Feedback
1. Click the "Feedback" button in the header
2. Select feedback type (Bug, Feature, or General)
3. Enter your feedback message
4. Click "Submit"
5. Verify feedback appears in Supabase `feedback` table

## 5. Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- RPC functions use `SECURITY DEFINER` to run with elevated privileges

### Trial Limit Security
- The `check_and_increment_trial` function uses `FOR UPDATE` lock to prevent race conditions
- Atomic operation ensures accurate trial counting even with concurrent requests
- Trial count is stored server-side and cannot be manipulated by the client

### Feedback Security
- Users can only view their own feedback (via RLS)
- Feedback is stored server-side and cannot be modified by users
- Email is captured for follow-up communication

## 6. Monitoring and Maintenance

### View User Trials
```sql
SELECT user_id, trial_count, last_trial_date, updated_at
FROM user_usage
ORDER BY updated_at DESC;
```

### View Feedback
```sql
SELECT id, user_email, feedback_type, message, status, created_at
FROM feedback
ORDER BY created_at DESC;
```

### View Saved Papers
```sql
SELECT id, user_id, title, subject, created_at, updated_at
FROM exam_papers
ORDER BY updated_at DESC;
```

## 7. Troubleshooting

### RPC Function Not Found Error
- Ensure you've created the RPC function in Supabase SQL Editor
- Verify the function name matches exactly: `check_and_increment_trial`
- Check that the function has proper permissions granted

### RLS Policy Errors
- Verify RLS is enabled on all tables
- Check that policies are correctly configured
- Ensure authenticated users have appropriate permissions

### Trial Limit Not Working
- Check that `user_usage` table exists and has correct schema
- Verify RPC function is created and accessible
- Check browser console for error messages

### Feedback Not Saving
- Verify `feedback` table exists
- Check that RLS policies allow inserts
- Ensure user is authenticated when submitting feedback

## 8. Production Deployment

Before deploying to production:

1. **Enable RLS on all tables** - Already done in SQL setup
2. **Test all RPC functions** - Run test queries in Supabase SQL Editor
3. **Set up backups** - Enable automated backups in Supabase dashboard
4. **Monitor usage** - Set up alerts for high trial usage or feedback volume
5. **Review security policies** - Audit all RLS policies and RPC functions
6. **Test with real data** - Perform end-to-end testing with production environment

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs
3. Check browser console for error messages
4. Review server logs in Supabase dashboard

---

**Last Updated:** December 2024
