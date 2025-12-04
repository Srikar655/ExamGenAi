import React, { useState } from 'react';
import { LayoutTemplate, Loader2, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { supabase } from './lib/supabase';
type AuthMode = 'login' | 'signup' | 'forgot';

export const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 1. Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    const response = await supabase.auth.signUp({
      email,
      password,
    });
    console.log(response);
    if (response.error) {
      setMessage({ type: 'error', text: response.error.message });
    } else {
      setMessage({ type: 'success', text: 'Success! Please check your email to confirm your account.' });
    }   
    setLoading(false);
  };

  // 2. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    }
    // If success, the onAuthStateChange in App.tsx will handle the redirect/state update automatically
    setLoading(false);
  };

  // 3. Handle Forgot Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Redirects back to your app to reset
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
                    <LayoutTemplate className="w-8 h-8 text-white" />
                </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
                {mode === 'login' ? 'Enter your credentials to access your papers' : 
                 mode === 'signup' ? 'Get started with ExamGen AI for free' : 
                 'Enter your email to receive a reset link'}
            </p>
        </div>

        {/* Feedback Message */}
        {message && (
            <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
            </div>
        )}

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignUp : handleResetPassword} className="space-y-4">
            
            {/* Email Input */}
            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="teacher@school.com"
                        required
                    />
                </div>
            </div>

            {/* Password Input (Hidden for Forgot Password mode) */}
            {mode !== 'forgot' && (
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>
                    {mode === 'login' && (
                        <div className="text-right mt-1">
                            <button type="button" onClick={() => setMode('forgot')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                Forgot password?
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Submit Button */}
            <button
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                 mode === 'login' ? <LogIn className="w-5 h-5" /> : 
                 mode === 'signup' ? <UserPlus className="w-5 h-5" /> : 
                 <Mail className="w-5 h-5" />
                }
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
        </form>

        {/* Footer / Toggle Mode */}
        <div className="mt-6 text-center text-sm text-gray-600">
            {mode === 'login' ? (
                <>Don't have an account? <button onClick={() => setMode('signup')} className="text-indigo-600 font-bold hover:underline">Sign up</button></>
            ) : (
                <>Already have an account? <button onClick={() => setMode('login')} className="text-indigo-600 font-bold hover:underline">Sign in</button></>
            )}
        </div>

      </div>
    </div>
  );
};