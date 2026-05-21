import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, BarChart3, Check, Trash2 } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const {
    organizations,
    usersList,
    orders,
    approveOrg,
    deleteOrg,
    deleteUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'analytics' | 'organizations' | 'users'>('analytics');
  
  // Searches
  const [orgSearch, setOrgSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Scopes & counts
  const totalVendors = organizations.length;
  const pendingVendors = organizations.filter(o => !o.isApproved).length;
  const activeStudents = usersList.filter(u => u.role === 'student').length;
  const totalOrders = orders.length;

  // Total GMV (Gross Merchandise Value) across platform
  const totalPlatformGMV = orders
    .filter(o => o.paymentStatus === 'Paid')
    .reduce((sum, o) => {
      if (o.orderType === 'xerox') {
        const cost = (o.printType === 'color' ? 10 : 2) * (o.copies || 1);
        return sum + cost;
      } else {
        return sum + (o.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0);
      }
    }, 0);

  // Split calculations for SVG chart
  const canteenOrderCount = orders.filter(o => o.orderType === 'canteen').length;
  const xeroxOrderCount = orders.filter(o => o.orderType === 'xerox').length;
  const stationeryOrderCount = orders.filter(o => o.orderType === 'stationery').length;

  const filteredOrgs = organizations.filter(org => {
    return org.organizationName.toLowerCase().includes(orgSearch.toLowerCase()) ||
           org.email.toLowerCase().includes(orgSearch.toLowerCase()) ||
           org.organizationType.toLowerCase().includes(orgSearch.toLowerCase());
  });

  const filteredUsers = usersList.filter(user => {
    return user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
           user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
           user.role.toLowerCase().includes(userSearch.toLowerCase());
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Super Admin Top Header */}
      <div className="bg-red-950 text-white py-6 px-6 sm:px-12 shadow-lg border-b border-red-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-900/60 border border-red-800 flex items-center justify-center text-xl shadow-inner">
              👑
            </div>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span>Platform Administration Control</span>
                <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                  Super Admin
                </span>
              </h1>
              <p className="text-xs text-red-200">SaaS Multi-Organization Tenant Governance Dashboard</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-red-900/40 hover:bg-red-900/60 text-slate-200'
              }`}
            >
              System Analytics
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold relative transition-all ${
                activeTab === 'organizations'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-red-900/40 hover:bg-red-900/60 text-slate-200'
              }`}
            >
              Shop Approvals
              {pendingVendors > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-red-950 w-4.5 h-4.5 rounded-full text-[9px] flex items-center justify-center font-black border border-red-950">
                  {pendingVendors}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-red-900/40 hover:bg-red-900/60 text-slate-200'
              }`}
            >
              User Accounts ({usersList.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        
        {/* PLATFORM ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Top counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Onboarded Shops</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalVendors}</p>
                <p className="text-[10px] text-yellow-600 mt-1 font-semibold">⚠️ {pendingVendors} Pending Admin Approval</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Students Registered</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{activeStudents}</p>
                <p className="text-[10px] text-emerald-600 mt-1 font-semibold">✓ Simulated JWT Verified sessions</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Tokens Processed</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalOrders}</p>
                <p className="text-[10px] text-slate-400 mt-1">canteen, xerox, stationery</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Transaction Volume</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">₹{totalPlatformGMV.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Razorpay Verified Settlements</p>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* SVG Order Split Chart */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-red-800" />
                  <span>Platform Order Distribution Volume</span>
                </h3>

                <div className="h-56 flex flex-col justify-end space-y-6">
                  {totalOrders === 0 ? (
                    <div className="text-center text-slate-400 py-12 text-xs">No orders recorded in database collections yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Canteens progress */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>🍔 Canteen Fast Food Orders</span>
                          <span>{canteenOrderCount} ({Math.round((canteenOrderCount/totalOrders)*100)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div 
                            className="bg-orange-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${(canteenOrderCount / totalOrders) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Xerox progress */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>🖨️ Xerox Document Print Jobs</span>
                          <span>{xeroxOrderCount} ({Math.round((xeroxOrderCount/totalOrders)*100)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div 
                            className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${(xeroxOrderCount / totalOrders) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Stationery progress */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>✏️ Stationery & Drawing Board Reserves</span>
                          <span>{stationeryOrderCount} ({Math.round((stationeryOrderCount/totalOrders)*100)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div 
                            className="bg-emerald-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${(stationeryOrderCount / totalOrders) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Analytics */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Platform Health Monitor</h3>
                
                <div className="space-y-4 text-xs">
                  <div className="border-b border-slate-100 pb-3 flex justify-between">
                    <span className="text-slate-400">Multer Storage</span>
                    <strong className="text-slate-700">920 KB base64 data</strong>
                  </div>
                  <div className="border-b border-slate-100 pb-3 flex justify-between">
                    <span className="text-slate-400">Auto-token locks</span>
                    <strong className="text-emerald-600 font-mono">Sequential (Strict)</strong>
                  </div>
                  <div className="border-b border-slate-100 pb-3 flex justify-between">
                    <span className="text-slate-400">Google Auth Scope</span>
                    <strong className="text-blue-600 font-mono">Firebase OAuth v2</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Razorpay verify</span>
                    <strong className="text-purple-600 font-mono">Verifying HMAC</strong>
                  </div>
                </div>

                <div className="p-3 bg-red-50 text-[10px] text-red-800 rounded border border-red-100 leading-relaxed">
                  🔒 <strong>Super Admin Powers:</strong> You have high-level write privileges. You can override organization approvals or purge user listings if compliance fails.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ORGANIZATION MANAGEMENT TAB */}
        {activeTab === 'organizations' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search organization by name, email, type..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <span className="text-xs text-slate-400 font-semibold">{organizations.length} organizations registered</span>
            </div>

            {/* Organizations Grid */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider">
                    <th className="p-4">Vendor Details</th>
                    <th className="p-4">Organization Type</th>
                    <th className="p-4">Public Info</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrgs.map(org => (
                    <tr key={org._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl w-8 h-8 rounded bg-slate-50 border flex items-center justify-center">
                            {org.logo.startsWith('data:') ? '🖼️' : org.logo}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{org.organizationName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {org._id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 capitalize font-semibold text-slate-700">
                        {org.organizationType === 'canteen' ? '🍔 Canteen Hub' : '🖨️ Print & Stationery'}
                      </td>

                      <td className="p-4 space-y-0.5">
                        <p>{org.email}</p>
                        <p className="text-slate-400">{org.phone}</p>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          org.isApproved 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-yellow-100 text-yellow-800 animate-pulse'
                        }`}>
                          {org.isApproved ? 'Approved' : 'Awaiting Approval'}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {!org.isApproved && (
                          <button
                            onClick={() => approveOrg(org._id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded text-[10px] transition-colors inline-flex items-center gap-0.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Shop</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to permanently delete this organization? All canteens and inventory data will be deleted.")) {
                              deleteOrg(org._id);
                            }
                          }}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors inline-flex items-center"
                          title="Delete Organization"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredOrgs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-slate-400 font-semibold">No organizations match searching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USER ACCOUNTS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search users by name, email, role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <span className="text-xs text-slate-400 font-semibold">{usersList.length} users registered</span>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider">
                    <th className="p-4">User Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Security Role</th>
                    <th className="p-4">Assigned Org Tenant ID</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{user.name}</td>
                      <td className="p-4 font-mono text-slate-600">{user.email}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'organization_admin' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {user.organizationId || '—'}
                      </td>
                      <td className="p-4 text-right">
                        {user.role !== 'super_admin' ? (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently delete user "${user.name}"?`)) {
                                deleteUser(user._id);
                              }
                            }}
                            className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors inline-flex items-center"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold px-2">Primary Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-slate-400 font-semibold">No user accounts found matching query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
