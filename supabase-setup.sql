-- ========================================
-- ExamGen AI - Supabase Database Setup
-- ========================================
-- Execute these SQL commands in your Supabase SQL Editor
-- Dashboard: https://app.supabase.com/project/YOUR_PROJECT/editor
--
-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste ALL commands below
-- 3. Click "Run" to execute
-- ========================================

-- ========================================
-- 1. CREATE TABLES
-- ========================================

-- 1.1 Create user_usage table (for Trial Limit Tracking)
-- ========================================
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_count INT NOT NULL DEFAULT 0,
  last_trial_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own usage data
DROP POLICY IF EXISTS "Users can view their own usage" ON user_usage;
CREATE POLICY "Users can view their own usage"
  ON user_usage FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can update usage (for RPC)
DROP POLICY IF EXISTS "Service role can update usage" ON user_usage;
CREATE POLICY "Service role can update usage"
  ON user_usage FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Users can insert their own usage
DROP POLICY IF EXISTS "Users can insert their own usage" ON user_usage;
CREATE POLICY "Users can insert their own usage"
  ON user_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 1.2 Create exam_papers table (for Dashboard)
-- ========================================
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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_exam_papers_user_id ON exam_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_papers_updated_at ON exam_papers(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE exam_papers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own papers
DROP POLICY IF EXISTS "Users can view their own papers" ON exam_papers;
CREATE POLICY "Users can view their own papers"
  ON exam_papers FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own papers
DROP POLICY IF EXISTS "Users can insert their own papers" ON exam_papers;
CREATE POLICY "Users can insert their own papers"
  ON exam_papers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own papers
DROP POLICY IF EXISTS "Users can update their own papers" ON exam_papers;
CREATE POLICY "Users can update their own papers"
  ON exam_papers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own papers
DROP POLICY IF EXISTS "Users can delete their own papers" ON exam_papers;
CREATE POLICY "Users can delete their own papers"
  ON exam_papers FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 1.3 Create feedback table (for Feedback Feature)
-- ========================================
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
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Enable Row Level Security (RLS)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own feedback
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert feedback
DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Authenticated users can insert feedback (for anonymous users)
DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON feedback;
CREATE POLICY "Authenticated users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- ========================================
-- 2. CREATE RPC FUNCTIONS
-- ========================================

-- 2.1 Create check_and_increment_trial RPC Function
-- ========================================
-- This function atomically checks if a user has remaining trials
-- and increments the count if allowed. This prevents race conditions.
-- ========================================
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

-- ========================================
-- 2.2 Create reset_user_trials RPC Function (Optional - Admin Use)
-- ========================================
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

-- ========================================
-- SETUP COMPLETE!
-- ========================================
-- Next steps:
-- 1. Verify all tables were created successfully
-- 2. Test the application by running: npm run dev
-- 3. Sign up and test the trial limit feature
-- ========================================
