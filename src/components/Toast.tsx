import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Bell, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Bell className="w-5 h-5 text-blue-400" />,
  };

  const bgMap = {
    success: 'border-emerald-500/30 bg-emerald-950/95',
    error: 'border-red-500/30 bg-red-950/95',
    info: 'border-blue-500/30 bg-slate-900/95',
  };

  const accentMap = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] max-w-sm w-full transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0'
      }`}
    >
      <div className={`relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl ${bgMap[type]}`}>
        {/* Accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentMap[type]}`} />
        
        <div className="p-4 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {iconMap[type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-relaxed">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 text-slate-400 hover:text-white transition-colors p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="h-0.5 bg-white/10">
          <div
            className={`h-full ${accentMap[type]} opacity-60`}
            style={{
              animation: 'shrink 3.5s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  );
};
