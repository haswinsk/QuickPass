import React from 'react';
import { Zap, Users, Store, ArrowRight, Printer, Utensils, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'login' | 'register' | 'register-org') => void;
  onExplore: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onExplore }) => {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#1E293B] text-white py-20 px-6 sm:px-12">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>

        <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 fill-blue-300" />
              SaaS Crowd Management Platform
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Eliminate Crowds. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Order & Print Instantly
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto md:mx-0">
              Campus QuickPass is a multi-vendor smart pickup platform. Canteens, Xerox centers, and stationery stores manage order queues, issue unique tokens, and reduce campus congestion seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
              <button
                onClick={onExplore}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25 text-sm"
              >
                <span>Browse Campus Vendors</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('register-org')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Store className="w-4 h-4" />
                <span>Onboard Your Shop</span>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white fill-white" />
              </div>
              
              <h3 className="font-bold text-white mb-3 text-xl">Smart Token System</h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                Get unique tokens for canteen, xerox, and stationery orders. Track status in real-time and skip the queue.
              </p>
              
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Food Orders</p>
                    <p className="text-blue-200 text-xs">Canteen tokens (C1-101)</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Printer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Print Services</p>
                    <p className="text-blue-200 text-xs">Xerox tokens (X-101)</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Stationery</p>
                    <p className="text-blue-200 text-xs">Store tokens (S-101)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Statistics */}
      <div className="max-w-6xl mx-auto -mt-8 px-6 relative z-10">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="p-6 text-center">
            <p className="text-3xl font-extrabold text-slate-900">4,280+</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Tokens Issued Daily</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-3xl font-extrabold text-blue-600">3.2 Min</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Average Collection Time</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-3xl font-extrabold text-emerald-600">98%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Crowd Congestion Reduced</p>
          </div>
        </div>
      </div>

      {/* Modules Explanation */}
      <div className="max-w-6xl mx-auto py-20 px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold text-slate-900">One Single SaaS Platform. Three Specialized Modules.</h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Each organization operates as an independent tenant, configuring their services while students access everything through a unified campus pass portal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Canteen Card */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-5">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Smart Food Canteens</h3>
            <p className="text-sm text-slate-600">
              Organizations manage multiple canteens under their profile. Each canteen maintains distinct menu catalogs and live orders. Online payment is mandatory before booking.
            </p>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Prefix-based Canteen Tokens (e.g. C1-102)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Live cooking status monitor for chefs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Mandatory Razorpay verification
              </li>
            </ul>
          </div>

          {/* Xerox Card */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-5">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Xerox Document Hub</h3>
            <p className="text-sm text-slate-600">
              Students upload lecture notes, assignments or slides as PDF/images, select page copies, decide color or black & white, and opt for Cash on Pickup or Razorpay online.
            </p>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Xerox-specific Tokens (e.g. X-101)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Multer-simulated secure file upload handler
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Optional online payment choice
              </li>
            </ul>
          </div>

          {/* Stationery Card */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-5">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Stationery & Lab Stores</h3>
            <p className="text-sm text-slate-600">
              Browse drawing boards, record manuals, chemistry kits, or notebooks. Real-time inventory tracking automatically locks items when they run out of stock.
            </p>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Stationery Tokens (e.g. S-101)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Live stock replenishment toggle
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Instant cart validation during checkout
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SaaS Tenant Callout */}
      <div className="bg-slate-100 border-t border-slate-200 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Are you a Campus Shop Vendor?</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Get your own dedicated shop panel. Register your team, manage your own catalogs/canteen menus, track order queues, and receive direct payments online.
          </p>
          <div>
            <button
              onClick={() => onNavigate('register-org')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2 text-sm transition-all"
            >
              <span>Onboard Your Shop Organization</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
