import React, { useState } from 'react';
import { Mail, ArrowRight, Globe, X } from 'lucide-react';

interface FirebaseGoogleModalProps {
  isOpen: boolean;
  onSuccess: (email: string, name: string) => void;
  onClose: () => void;
}

export const FirebaseGoogleModal: React.FC<FirebaseGoogleModalProps> = ({
  isOpen,
  onSuccess,
  onClose
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSelectAccount = async (email: string, name: string) => {
    setIsProcessing(true);
    // Simulate OAuth2 exchange delay
    await new Promise(r => setTimeout(r, 1000));
    setIsProcessing(false);
    onSuccess(email, name);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    handleSelectAccount(customEmail, customName);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Google Popup Header */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-sm text-slate-700">Sign in with Google</span>
          </div>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">Campus QuickPass OAuth</h3>
            <p className="text-xs text-slate-500 mt-1">Choose an account to continue to quickpass.campus.edu</p>
          </div>

          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-600">Connecting to Google services...</p>
              <p className="text-xs text-slate-400">Authenticating Firebase credentials...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account list */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectAccount('student@campus.edu', 'Rahul Verma')}
                  className="w-full text-left p-3 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-lg flex items-center gap-3 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">
                    RV
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Rahul Verma (Default Student)</p>
                    <p className="text-xs text-slate-400">student@campus.edu</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAccount('soniagupta@campus.edu', 'Sonia Gupta')}
                  className="w-full text-left p-3 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-lg flex items-center gap-3 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                    SG
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Sonia Gupta</p>
                    <p className="text-xs text-slate-400">soniagupta@campus.edu</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase">Or custom account</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Custom input */}
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Google Display Name</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="E.g. Joy Das"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Google Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="E.g. joy@campus.edu"
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg text-sm transition-colors mt-2"
                >
                  Authorize Custom Account
                </button>
              </form>
            </div>
          )}

          <p className="text-[10px] text-slate-400 text-center mt-5">
            By signing in, Google will share your profile name, email address, and avatar with Campus QuickPass.
          </p>
        </div>
      </div>
    </div>
  );
};
