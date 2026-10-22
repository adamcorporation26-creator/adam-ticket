import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff, Bot, Sparkles } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials: username "adamadmin" and password "adam0626"
      if (username.trim() === 'adamadmin' && password === 'adam0626') {
        localStorage.setItem('adam_admin_auth', 'authenticated');
        localStorage.setItem('adam_admin_user', 'adamadmin');
        onLoginSuccess();
      } else {
        setError('❌ Invalid username or password. Please try again.');
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-[#131317] border border-zinc-800/90 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
        {/* Logo & Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="relative inline-block">
            <img 
              src="/adam_corp_logo.jpg" 
              alt="ADAM CORPORATION" 
              className="w-16 h-16 rounded-2xl object-cover mx-auto border-2 border-yellow-500/40 shadow-lg shadow-yellow-500/10"
            />
            <div className="absolute -bottom-1 -right-1 p-1 bg-yellow-500 rounded-full text-black">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">ADAM CORPORATION</h1>
            <p className="text-xs text-zinc-400 font-medium mt-1">Ticket King Administration Portal</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center animate-shake">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (adamadmin)"
                className="w-full bg-[#18181d] border border-zinc-800 focus:border-yellow-500/70 focus:ring-1 focus:ring-yellow-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (adam0626)"
                className="w-full bg-[#18181d] border border-zinc-800 focus:border-yellow-500/70 focus:ring-1 focus:ring-yellow-500/50 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-extrabold text-xs py-3 px-4 rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-5 border-t border-zinc-800/60 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
            <Bot className="w-3.5 h-3.5 text-yellow-500" />
            <span>Protected by ADAM CORPORATION Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
