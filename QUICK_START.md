# Quick Start Guide - ExamGen AI Enhanced

Get up and running in 5 minutes!

## Step 1: Clone and Install (2 min)

```bash
# Navigate to project directory
cd examgen-ai-enhanced

# Install dependencies
npm install
```

## Step 2: Get API Keys (2 min)

### Supabase Keys
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select existing one
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon (public)** key → `VITE_SUPABASE_ANON_KEY`

### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy the key → `VITE_GEMINI_API_KEY`

## Step 3: Create .env.local (1 min)

Create a file named `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

## Step 4: Set Up Supabase Database (1 min)

1. Go to your Supabase project
2. Click **SQL Editor**
3. Click **New Query**
4. Copy-paste the SQL from [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)
5. Click **Run**

**That's it!** All tables and functions are created.

## Step 5: Run the App (1 min)

```bash
npm run dev
```

Open your browser:
- **Landing Page:** http://localhost:5173/landing.html
- **App:** http://localhost:5173/index.html

## What to Test

### 1. Landing Page
- [ ] Visit `/landing.html`
- [ ] Click "Launch App" button
- [ ] Verify smooth navigation

### 2. Authentication
- [ ] Sign up with email
- [ ] Verify email (check spam folder)
- [ ] Log in with credentials

### 3. Dashboard
- [ ] Click "Dashboard" button in header
- [ ] Should show empty state initially
- [ ] Go back to editor

### 4. Trial Limit
- [ ] Upload exam images
- [ ] Click "Generate Paper" (Trial 1/3)
- [ ] Create another paper (Trial 2/3)
- [ ] Create another paper (Trial 3/3)
- [ ] Try 4th time - should see "Trial limit exceeded"

### 5. Save to Cloud
- [ ] Generate a paper
- [ ] Click "Save" button
- [ ] Go to Dashboard
- [ ] Verify paper appears in list
- [ ] Click "Load" to reload it

### 6. Feedback
- [ ] Click feedback icon (💬) in header
- [ ] Select feedback type
- [ ] Enter message
- [ ] Click "Submit"
- [ ] Should see success message

## Troubleshooting

### "Missing Supabase URL or Anon Key"
- Check `.env.local` file exists
- Verify variable names are exactly correct
- Restart dev server (`npm run dev`)

### "RPC function not found"
- Go to Supabase SQL Editor
- Run the SQL from SETUP_INSTRUCTIONS.md again
- Verify function name is `check_and_increment_trial`

### "Failed to analyze exam sheet"
- Check Gemini API key is correct
- Verify API key is active in Google AI Studio
- Try with a clearer image

### Blank page on /landing.html
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors

## Next Steps

1. **Customize Branding**
   - Edit `landing.html` for landing page
   - Update colors in `App.tsx`
   - Change default school details

2. **Deploy to Production**
   - Follow [Deployment Guide](./README_ENHANCED.md#deployment)
   - Set environment variables in hosting platform
   - Test all features on production

3. **Add More Features**
   - Extend Dashboard with filters
   - Add sharing functionality
   - Implement team collaboration

## Need Help?

1. Check [README_ENHANCED.md](./README_ENHANCED.md)
2. Review [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)
3. Check browser console for errors (F12)
4. Use in-app Feedback feature to report issues

---

**Happy exam generating!** 📚✨
