import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, User, Phone, MapPin, Store, FileText, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
  onNavigate: (page: 'login' | 'register' | 'register-org') => void;
}

export const LoginPage: React.FC<AuthPageProps> = ({ onSuccess, onNavigate }) => {
  const { login, loginWithGoogle, isLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    const res = await login(email, password);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const res = await loginWithGoogle();
    if (res.success) {
      onSuccess();
    } else if (res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl shadow-blue-500/5 rounded-2xl overflow-hidden p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black text-lg mx-auto shadow-lg shadow-blue-500/25">
            QP
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-3">Welcome Back</h2>
          <p className="text-xs text-slate-500">Sign in to place orders, track tokens & pick up instantly.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <span className="text-[10px] text-blue-600 hover:underline cursor-pointer font-medium">Forgot?</span>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Google Divider */}
        <div className="flex items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase">Or continue with</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Real Firebase Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
        </button>

        <div className="text-center pt-2 text-xs text-slate-600 space-y-1.5">
          <p>
            Don't have a student account?{' '}
            <button onClick={() => onNavigate('register')} className="text-blue-600 hover:underline font-semibold">
              Sign Up
            </button>
          </p>
          <p>
            Are you a vendor?{' '}
            <button onClick={() => onNavigate('register-org')} className="text-emerald-600 hover:underline font-semibold">
              Onboard Your Shop
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const StudentRegisterPage: React.FC<AuthPageProps> = ({ onSuccess, onNavigate }) => {
  const { registerStudent, login, isLoading } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const regResult = await registerStudent(name, email.toLowerCase(), password);
    if (regResult.success) {
      const logResult = await login(email.toLowerCase(), password);
      if (logResult.success) onSuccess();
      else onNavigate('login');
    } else {
      setError(regResult.error || 'Registration failed.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl shadow-blue-500/5 rounded-2xl overflow-hidden p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black text-lg mx-auto shadow-lg shadow-blue-500/25">
            QP
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-3">Student Sign Up</h2>
          <p className="text-xs text-slate-500">Create your account to place orders and receive tokens instantly.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Verma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Campus Email Address</label>
            <div className="relative">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@campus.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
            {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Creating Account...</span></>) : (<span>Create Account</span>)}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-600">
          Already have a student account?{' '}
          <button onClick={() => onNavigate('login')} className="text-blue-600 hover:underline font-semibold">Sign In</button>
        </div>
      </div>
    </div>
  );
};

export const OrgRegisterPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { registerOrg, isLoading } = useApp();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Shop Details
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'canteen' | 'xerox_stationery'>('canteen');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('🍱');
  const [description, setDescription] = useState('');

  // Admin Account Details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');

  const [onboardingSuccess, setOnboardingSuccess] = useState(false);

  const handleNext = () => {
    setError(null);
    if (!orgName || !email || !phone || !address || !description) {
      setError('Please fill in all shop information fields.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminName || !adminEmail || !adminPass) {
      setError('Please fill in all administrator account fields.');
      return;
    }
    if (adminPass !== confirmAdminPass) {
      setError('Administrator passwords do not match.');
      return;
    }
    if (adminPass.length < 6) {
      setError('Administrator password must be at least 6 characters.');
      return;
    }

    const res = await registerOrg({
      orgName, orgType,
      email: email.toLowerCase(),
      phone, address, logo, description,
      adminName,
      adminEmail: adminEmail.toLowerCase(),
      adminPass
    });

    if (res.success) {
      setOnboardingSuccess(true);
    } else {
      setError(res.error || 'Organization onboarding failed.');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        setError('Logo size must be under 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (onboardingSuccess) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 min-h-[85vh] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-lg bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/25">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Registration Complete!</h2>
          <div className="space-y-3 text-slate-600 text-sm max-w-md mx-auto">
            <p>
              Your organization profile for <strong className="text-slate-900">"{orgName}"</strong> has been submitted.
            </p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-xs space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Pending Super Admin Approval</span>
              </p>
              <p>New vendors must be verified by the campus administrator. Your admin login will be enabled upon approval.</p>
            </div>
          </div>
          <button onClick={() => onNavigate('login')}
            className="bg-slate-950 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">
            Return to Login Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-xl shadow-blue-500/5 rounded-2xl overflow-hidden p-8 space-y-6">

        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">SaaS Vendor Registration</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">Register Campus Organization</h2>
          <p className="text-xs text-slate-500">Provide vendor details and configure administrative access.</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4 max-w-xs mx-auto text-xs font-semibold">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${step === 1 ? 'border-blue-600 bg-blue-50 font-bold' : 'border-slate-300'}`}>1</span>
            <span>Shop Profile</span>
          </div>
          <div className="flex-1 border-t border-slate-200"></div>
          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${step === 2 ? 'border-blue-600 bg-blue-50 font-bold' : 'border-slate-300'}`}>2</span>
            <span>Admin Account</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Organization Name</label>
                <div className="relative">
                  <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="E.g. Central Science Canteen"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Organization Type</label>
                <select value={orgType} onChange={(e) => setOrgType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all">
                  <option value="canteen">Smart Canteen / Cafeteria</option>
                  <option value="xerox_stationery">Xerox Printing & Stationery Store</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Public Shop Email</label>
                <div className="relative">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="shop@campus.edu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone Number</label>
                <div className="relative">
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Campus Location / Address</label>
              <div className="relative">
                <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Block B, Room 102, Ground Floor"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Logo Section */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Choose Shop Logo</label>
              <div className="flex flex-wrap gap-2 items-center">
                {['🍱', '🍔', '☕', '🖨️', '📐', '✏️', '📚', '🛒'].map(emoji => (
                  <button key={emoji} type="button" onClick={() => setLogo(emoji)}
                    className={`w-10 h-10 text-xl rounded-xl border transition-all flex items-center justify-center ${
                      logo === emoji ? 'border-blue-600 bg-blue-50 scale-110 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-100'
                    }`}>
                    {emoji}
                  </button>
                ))}
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload"
                    className="px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-600 cursor-pointer transition-all flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Upload Image
                  </label>
                </div>
                {logo.startsWith('data:') && (
                  <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Custom Logo Loaded
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description / Services Offered</label>
              <div className="relative">
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g. Serving hot breakfast and lunch combos with clean table spacing."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button type="button" onClick={handleNext}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1">
              <span>Continue to Admin Settings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Administrator Full Name</label>
              <div className="relative">
                <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="E.g. Mr. Alok Sen"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Administrator Email Address</label>
              <div className="relative">
                <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin.shop@campus.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Password</label>
                <div className="relative">
                  <input type="password" required value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type="password" required value={confirmAdminPass} onChange={(e) => setConfirmAdminPass(e.target.value)} placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Back
              </button>
              <button type="submit" disabled={isLoading}
                className="w-2/3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Onboarding Vendor...</span></>) : (<span>Register & Onboard Shop</span>)}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 text-xs text-slate-600">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-blue-600 hover:underline font-semibold">Sign In</button>
        </div>
      </div>
    </div>
  );
};
